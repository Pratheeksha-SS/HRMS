from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, Numeric, Interval, Time
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "hrms_user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String, unique=True)
    role = Column(String)
    is_active = Column(Boolean)
    
    # Relationships
    employee_profile = relationship("Employee", back_populates="user", uselist=False)

class Employee(Base):
    __tablename__ = "hrms_employee"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("hrms_user.id"))
    first_name = Column(String)
    last_name = Column(String)
    employee_id = Column(String, unique=True)
    department = Column(String)
    designation = Column(String)
    sick_leave_balance = Column(Integer)
    casual_leave_balance = Column(Integer)
    paid_leave_balance = Column(Integer)
    sick_leave_total = Column(Integer)
    casual_leave_total = Column(Integer)
    paid_leave_total = Column(Integer)

    user = relationship("User", back_populates="employee_profile")
    attendance_records = relationship("EmployeeAttendance", back_populates="employee")
    leave_balances = relationship("LeaveBalance", back_populates="employee_rel")

class LeaveBalance(Base):
    __tablename__ = "hrms_leavebalance"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("hrms_employee.id"))
    leave_type = Column(String)
    total_allocated = Column(Numeric)
    total_used = Column(Numeric)
    remaining = Column(Numeric)
    year = Column(Integer)
    
    employee_rel = relationship("Employee", back_populates="leave_balances")

class Leave(Base):
    __tablename__ = "hrms_leave"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("hrms_user.id")) # Note: in Django it's tied to AUTH_USER_MODEL
    leave_type = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    status = Column(String)
    reason = Column(String)

class Holiday(Base):
    __tablename__ = "hrms_holiday"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    date = Column(Date)
    holiday_type = Column(String)
    is_active = Column(Boolean)

class EmployeeAttendance(Base):
    __tablename__ = "hrms_employeeattendance"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("hrms_employee.id"), nullable=True)
    date = Column(Date)
    status = Column(String)
    in_time = Column(Time)
    out_time = Column(Time)
    duration = Column(Interval)
    
    employee = relationship("Employee", back_populates="attendance_records")

