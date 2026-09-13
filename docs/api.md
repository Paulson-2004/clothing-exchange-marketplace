# API Reference

The ReWear backend provides a RESTful JSON API. All protected endpoints require a valid JWT passed via an `HttpOnly` cookie.

## Authentication (`/api/auth`)

- `POST /register`: Register a new user.
- `POST /login`: Authenticate and receive a JWT cookie.
- `POST /logout`: Clear the JWT cookie.
- `GET /profile`: Get the user's detailed profile.
- `PATCH /profile` / `PUT /profile`: Update the user's profile.
- `PUT /password`: Change password.
- `DELETE /account`: Delete the user account.
- `GET /me`: Get the currently authenticated user's profile.

## Listings (`/api/listings`)

- `GET /`: Retrieve all public listings. Supports query parameters for filtering (`search`, `category`, `size`, `condition`, `city`, `state`, `status`).
- `GET /mine/all`: Get the authenticated user's listings.
- `GET /estimate-value`: Estimate a listing's value based on category/brand/condition.
- `GET /compare`: Compare the value of two listings.
- `GET /:id/matches`: Get location and value compatible matches for a listing.
- `GET /:id`: Retrieve a specific listing by its ID.
- `POST /`: Create a new listing (Requires Authentication).
- `PUT /:id`: Update a listing (Requires Owner or Admin).
- `DELETE /:id`: Delete a listing (Requires Owner or Admin).

## Swaps (`/api/swaps`)

- `POST /`: Initiate a new swap request offering specific items.
- `GET /incoming`: Get incoming swap requests.
- `GET /sent`: Get sent swap requests.
- `PATCH /:id/accept`: Accept a swap request.
- `PATCH /:id/reject`: Reject a swap request.
- `PATCH /:id/cancel`: Cancel a swap request.
- `PATCH /:id/complete`: Complete a swap request.

## Chat (`/api/chat`)

- `GET /conversations`: Get all chat conversations for the user.
- `POST /conversations`: Create or find a conversation.
- `GET /conversations/:id/messages`: Get messages for a conversation.
- `PATCH /conversations/:id/read`: Mark a conversation as read.
- `POST /conversations/:id/messages`: Send a new message in a conversation.

## Admin (`/api/admin`)

*All admin endpoints require a user with the `role: 'admin'`.*

- `GET /stats`: Get platform-wide statistics for the dashboard.
- `GET /users`: List all users.
- `GET /users/:id`: Get a specific user's details.
- `PATCH /users/:id/role`: Toggle a user's role.
- `DELETE /users/:id`: Delete a user.
- `GET /listings`: List all platform listings (bypassing normal public visibility filters).
- `DELETE /listings/:id`: Administratively delete a listing.
- `GET /swaps`: List all platform swap requests.

## Error Handling

The API returns standard HTTP status codes. Error responses follow a consistent format:

```json
{
  "success": false,
  "message": "Description of the error message"
}
```

