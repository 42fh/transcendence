
# Chat Application API

## **Users Endpoint**

### `GET /users/`

Retrieve a list of all users, along with their chat statuses and blocking information.

#### **Request**

- **Headers**:
  - `Authorization`: (required)

#### **Response**

- **Status**: `200 OK`

```json
{
  "status": "success",
  "users": [
    {
      "username": "johndoe",
      "has_chat": true,
      "is_blocked": false,
      "has_blocked_you": false
    },
    {
      "username": "janedoe",
      "has_chat": false,
      "is_blocked": true,
      "has_blocked_you": false
    }
  ]
}
```

- **Status**: `401 Unauthorized`
  ```json
  {
    "status": "error",
    "message": "User not authenticated"
  }
  ```

---

## **Blocked User Endpoint**

### `POST /blocked_user/`

Block a user.

#### **Request**

- **Headers**:
  - `Authorization`: (required)
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "username": "target_username"
  }
  ```

#### **Response**

- **Status**: `200 OK`

```json
{
  "status": "success",
  "message": "Blocked user target_username"
}
```

- **Status**: `400 Bad Request`
  ```json
  {
    "status": "error",
    "message": "Cannot block/unblock yourself"
  }
  ```

### `DELETE /blocked_user/`

Unblock a user.

#### **Request**

- **Headers**:
  - `Authorization`: (required)
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "username": "target_username"
  }
  ```

#### **Response**

- **Status**: `200 OK`

**Success Example**:

```json
{
  "status": "success",
  "message": "Unblocked user target_username"
}
```

**Error Example**:

- **Status**: `404 Not Found`
  ```json
  {
    "status": "error",
    "message": "User not found"
  }
  ```

---

## **Mark Messages as Read**

### `POST /mark_messages_read/<room_id>/`

Mark all messages in a specific chat room as read.

#### **Request**

- **Headers**:
  - `Authorization`: (required)

#### **Response**

- **Status**: `200 OK`

**Success Example**:

```json
{
  "status": "success",
  "message": "Messages marked as read"
}
```

**Error Example**:

- **Status**: `404 Not Found`
  ```json
  {
    "status": "error",
    "message": "Chat room not found"
  }
  ```

