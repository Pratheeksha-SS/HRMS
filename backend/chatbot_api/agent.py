import os
import json
from sqlalchemy.orm import Session
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, SystemMessage
from . import models
from .rag_engine import search_documents

# In-memory session context for demo purposes. 
# For production, this should be stored in the DB (like ChatSession/ChatMessage).
SESSION_MEMORY = {}

def get_llm():
    api_key = os.getenv("GOOGLE_API_KEY", os.getenv("GEMINI_API_KEY"))
    return ChatGoogleGenerativeAI(model="gemini-2.5-flash", google_api_key=api_key, temperature=0.3)

def fetch_db_context(db: Session, user: models.User, query: str):
    """
    Naively fetch the user's structured data. 
    In a more advanced version, we would use an LLM router to dynamically construct SQL or fetch specific pieces.
    Here we fetch all relevant context for the logged-in user.
    """
    employee = user.employee_profile
    if not employee:
        return "No employee record found for this user."

    # Leave balances
    leave_balances = db.query(models.LeaveBalance).filter(models.LeaveBalance.employee_id == employee.id).all()
    leave_context = "Leave Balances:\n"
    for lb in leave_balances:
        leave_context += f"- {lb.leave_type}: Total Allocated {lb.total_allocated}, Used {lb.total_used}, Remaining {lb.remaining}\n"

    # Recent Attendance
    attendance = db.query(models.EmployeeAttendance).filter(
        models.EmployeeAttendance.employee_id == employee.id
    ).order_by(models.EmployeeAttendance.date.desc()).limit(5).all()
    
    att_context = "Recent Attendance:\n"
    for a in attendance:
        att_context += f"- Date: {a.date}, Status: {a.status}, Duration: {a.duration}\n"
        
    # Upcoming Holidays
    # Just an example, fetching 5 recent or active holidays
    holidays = db.query(models.Holiday).filter(models.Holiday.is_active == True).limit(5).all()
    hol_context = "Upcoming/Recent Holidays:\n"
    for h in holidays:
        hol_context += f"- {h.name} on {h.date} ({h.holiday_type})\n"

    context = f"User Name: {employee.first_name} {employee.last_name}\n"
    context += f"Department: {employee.department}\n"
    context += f"Designation: {employee.designation}\n\n"
    context += leave_context + "\n" + att_context + "\n" + hol_context
    return context

def process_chat(query: str, user: models.User, db: Session, session_id: str = "default"):
    llm = get_llm()
    
    # 1. RAG Context
    rag_context = search_documents(query)
    
    # 2. DB Context
    db_context = fetch_db_context(db, user, query)
    
    # 3. Memory
    if session_id not in SESSION_MEMORY:
        SESSION_MEMORY[session_id] = []
    
    history = SESSION_MEMORY[session_id][-5:] # Keep last 5 messages
    history_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in history])
    
    # 4. Prompt Construction
    system_prompt = f"""You are an AI-powered HR Assistant for an organization. 
Answer the user's question accurately based on the provided Data Context and Document Context. 
Do not hallucinate data. If the answer is not in the context, state that you do not have that information.
The user's name is {user.first_name} {user.last_name} and they have a role of {user.role}.

=== Data Context (from CRM Database) ===
{db_context}

=== Document Context (from HR Policies) ===
{rag_context}

=== Conversation History ===
{history_str}
"""
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=query)
    ]
    
    # 5. Get Answer
    response = llm.invoke(messages)
    answer = response.content
    
    # Update memory
    SESSION_MEMORY[session_id].append({"role": "User", "content": query})
    SESSION_MEMORY[session_id].append({"role": "Assistant", "content": answer})
    
    return answer
