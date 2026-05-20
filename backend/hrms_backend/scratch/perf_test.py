import time
import requests

BASE_URL = "http://localhost:8000/api"

def get_token(username, password):
    res = requests.post(f"{BASE_URL}/token/", json={"username": username, "password": password})
    return res.json().get('access')

def test_endpoint(endpoint, token, name):
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    res = requests.get(f"{BASE_URL}/{endpoint}", headers=headers)
    end = time.time()
    duration = end - start
    print(f"{name}: {duration:.4f}s (Status: {res.status_code})")
    return duration

if __name__ == "__main__":
    # Note: Replace with actual valid credentials for your local environment
    # For now, this is a template. You need to have the server running.
    print("Testing HRMS Backend Performance...")
    
    # Example usage:
    # token = get_token("admin", "admin123")
    # if token:
    #     test_endpoint("dashboard-stats/", token, "Dashboard Stats")
    #     test_endpoint("manager-leaves/", token, "Manager Leaves")
    #     test_endpoint("department-employees/", token, "Department Employees")
    
    print("\nPlease ensure the Django server is running on http://localhost:8000")
