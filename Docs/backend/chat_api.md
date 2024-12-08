# Chat API Documentation

## HTTP Endpoints

| Method | URL                    | Description                                           |
|--------|------------------------|-------------------------------------------------------|
| GET    | `/users/`              | Retrieve a list of conversations for the user.        |
| GET, POST, DELETE | `/blocked_user/` | View, block, or unblock a user.                       |
| GET    | `/notifications/`      | Retrieve notifications for the user.                  |
| PATCH  | `/notifications/`      | Update the read status of notifications.              |
| POST   | `/notifications/`      | Create a new notification for the user.               | 

Note: All endpoints are prefixed with `api/chat` in `urls.py`: `path("api/chat/", include("chat.urls"))`

For an in-practice example of the usage you can head out to `frontend/js/services/chat*.js

---

### Get All Conversations

This endpoint retrieves a list of all active conversations the current user is involved in, excluding any users who have been blocked by or are blocking the user.

- **URL**: `/users/`  
  *(The root URL is already prefixed with `api/chat`)*
- **Method**: `GET`
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "status": "success",
        "users": [
            {
                "username": "john_doe",
                "unread_messages": 5
            },
            {
                "username": "jane_smith",
                "unread_messages": 2
            }
        ]
    }
    ```
- **Error Responses**:
  - `401`: Unauthorized - User is not authenticated
  - `500`: Internal server error

---

### Block/Unblock User

This endpoint allows the user to view blocked users, block a user, or unblock a user.

- **URL**: `/blocked_user/`  
- **Method**: 
  - `GET`: View blocked users.
  - `POST`: Block a user.
  - `DELETE`: Unblock a user.
- **Request Body**: For `POST` and `DELETE`, the request body must contain the username of the user to block or unblock:
  ```json
  {
      "username": "LexFridman"
  }
  ```
- **Success Response**:
  - `GET`: 
    ```json
    {
        "status": "success",
        "blocked_users": ["LexFridman", "ElonMusk"]
    }
    ```
  - `POST`/`DELETE`:
    ```json
    {
        "status": "success",
        "message": "Blocked user john_doe"
    }
    ```
- **Error Responses**:
  - `400`: Missing username in request
  - `404`: User not found
  - `409`: Cannot block/unblock yourself
  - `405`: Method not allowed
  - `500`: Internal server error

---

### Notifications
- ⚠️ STILL UNDER CONSTRUCTION: have to be refactored so a single notification can be marked as read

This endpoint retrieves a list of notifications for the authenticated user. Notifications include a message, timestamp, and read status.

- **URL**: `/notifications/`  
- **Method**: `GET`
- **Request Body**: None
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "status": "success",
        "notifications": [
            {
                "id": 1,
                "message": "New message from Dev",
                "created_at": "2024-12-08T14:35:22+00:00",
                "is_read": false
            },
            {
                "id": 2,
                "message": "New message from LexFriedman",
                "created_at": "2024-12-08T12:45:12+00:00",
                "is_read": true
            }
        ]
    }
    ```
- **Error Responses**:
  - `500`: Internal server error

---

### Update Notifications 

This endpoint updates the read status of notifications. It marks all notifications for the authenticated user as either read or unread.

- **URL**: `/notifications/`  
- **Method**: `PATCH`
- **Request Body**:  
  The request body must include the `is_read` field to set the read status:
  ```json
  {
      "is_read": true
  }
  ```
- **Success Response**:
  - Code: `200`
  - Content:
    ```json
    {
        "status": "success",
        "message": "All notifications updated successfully"
    }
    ```
- **Error Responses**:
  - `400`: Missing `is_read` field
  - `500`: Internal server error

---

### Create Notification

This endpoint allows creating a new notification for the authenticated user.

- **URL**: `/notifications/`  
- **Method**: `POST`
- **Request Body**:  
  The request body must include the `message` field for the notification content:
  ```json
  {
      "message": "You have a new message from Dev."
  }
  ```
- **Success Response**:
  - Code: `201`
  - Content:
    ```json
    {
        "status": "success",
        "message": "Notification created successfully",
        "id": 1
    }
    ```
- **Error Responses**:
  - `400`: Missing `message` field
  - `500`: Internal server error

---

### Notes

- All endpoints require the user to be authenticated.

## A notification can be created with the POST method above or in the backend through a signal (as in the create_message_notification function when a new Message is created)




