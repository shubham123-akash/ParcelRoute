# Parcel Routing System

A small MERN-based parcel routing application for a technical assessment. It uses one Express/Node.js backend, MongoDB, and a React UI. No microservices and no RBAC.

## Features

- User register/login/logout with JWT in an HTTP-only cookie
- Manual parcel routing
- JSON batch upload (up to 1,000 parcels)
- Configurable routing rules in MongoDB
- Audit logs and request IDs
- Joi validation
- Rate limiting, Helmet, CORS, bcrypt
- Jest routing tests
- User-owned parcel data

## Business Rules

| Condition | Decision |
|---|---|
| Weight <= 1 kg | MAIL |
| Weight <= 10 kg | REGULAR |
| Weight > 10 kg | HEAVY |
| Value > €1,000 | INSURANCE_REQUIRED |

Rules are data-driven. Example:

```javascript
{
  name: "Oversized above 20kg",
  type: "ROUTING",
  field: "weight",
  operator: ">",
  value: 20,
  action: "OVERSIZED",
  priority: 25,
  enabled: true,
  version: 1
}
```

A new rule can be added without changing the routing algorithm.

## Architecture

```text
React UI
   |
   | REST API
   v
Express
   |
   +--> Auth / Validation
   |
   +--> Controllers
          |
          v
    Routing Service
          |
          v
       MongoDB
     /    |     \
 Users  Parcels Rules AuditLogs
```

Main principle:

```text
Controller -> Routing Service -> Rules
```

The controller handles HTTP/persistence; the routing service handles business decisions.

## Structure

```text
parcel-routing-system/
├── client/
│   └── src/
│       ├── components/
│       │   ├── ParcelForm.jsx
│       │   ├── BatchUpload.jsx
│       │   └── RoutingResult.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Register.jsx
│       │   └── Dashboard.jsx
│       ├── services/api.js
│       ├── App.jsx
│       └── main.jsx
├── server/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   ├── validators/
│   ├── utils/
│   ├── seed/seedRules.js
│   ├── tests/routing.test.js
│   ├── app.js
│   └── server.js
└── README.md
```

## Routing Flow

```text
Parcel
  |
  v
Authentication
  |
  v
Joi Validation
  |
  v
Load enabled rules
  |
  v
Check GATE rules
  |
  +--> match -> INSURANCE_REQUIRED
  |
  v
Check ROUTING rules
  |
  +--> first match -> department
  |
  +--> no match -> FAILED
  |
  v
Save Parcel + Audit Log
  |
  v
Return result to UI
```

GATE rules are checked before department routing so a high-value parcel cannot bypass insurance approval.

## Safe Rule Changes

For a business change such as:

> Parcels above 20 kg go to Oversized.

Add a rule and tests rather than changing the routing engine:

```text
20 kg      -> HEAVY
20.01 kg   -> OVERSIZED
```

Recommended production workflow:

```text
Business request
 -> rule change
 -> boundary tests
 -> review
 -> version/deploy
 -> monitor
```

Each parcel stores the matched rule and rule version.

`seedRules.js` is for local/demo initialization, not unrestricted production editing.

## Authentication and Security

Implemented:

- bcrypt password hashing
- JWT + HTTP-only cookie
- CORS
- Helmet
- Joi validation
- Rate limiting
- Request body/batch limits
- Safe error responses
- Request IDs
- Parcel ownership checks

There is no RBAC. Authenticated users have the same application permissions, while parcel queries are filtered by the logged-in user's `userId`.

For production, HTTPS, secret management, centralized logs, backups, stronger upload scanning, and distributed rate limiting should be added.

## Batch Upload

JSON was chosen because it is simple for React/Node.js.

Example:

```json
[
  {
    "weight": 0.5,
    "value": 200,
    "destinationCountry": "IN"
  },
  {
    "weight": 5,
    "value": 500,
    "destinationCountry": "IN"
  }
]
```

Sent to:

```http
POST /api/parcels/batch
```

## Monitoring and Reliability

Each request gets a request ID.

Audit logs store:

- parcel ID
- status
- department
- matched rule
- rule version
- request ID

This connects:

```text
Request ID -> Logs -> Parcel -> Rule/Version -> Audit Log
```

Health check:

```http
GET /health
```

The system records `FAILED` when no rule matches instead of silently selecting a department.

## Testing

The routing service is tested independently from MongoDB.

Run:

```bash
npm test
```

Important cases:

```text
1 kg       -> MAIL
1.01 kg    -> REGULAR
10 kg      -> REGULAR
10.01 kg   -> HEAVY
€1000      -> normal routing
€1000.01   -> INSURANCE_REQUIRED
```

For Oversized:

```text
20 kg      -> HEAVY
20.01 kg   -> OVERSIZED
```

## API

### Auth

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Parcels

```text
POST /api/parcels
POST /api/parcels/batch
GET  /api/parcels
GET  /api/parcels/:id
GET  /api/parcels/rules
```

## Local Setup

### Backend

```bash
cd server
npm install
npm run seed:rules
npm run dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

## Assessment Demo

1. Register and login.
2. Route `0.5 kg -> MAIL`.
3. Route `5 kg -> REGULAR`.
4. Route `15 kg -> HEAVY`.
5. Route `€1500 -> INSURANCE_REQUIRED`.
6. Upload a JSON batch.
7. Show recent parcels and active rules.
8. Add `OVERSIZED > 20 kg`.
9. Run the boundary tests.
10. Explain validation, security, audit logs, and request IDs.

## AI Usage

AI was used for:

- initial scaffolding
- routing-service design
- validation/middleware
- React scaffolding
- test suggestions
- debugging

Generated code was reviewed, modified, and tested manually.

Important limitations:

- AI can make incorrect assumptions.
- Generated code can contain inconsistent paths or fields.
- Security-sensitive code needs manual review.
- Business rules must be verified.
- Tests remain necessary.

## Trade-offs

**MongoDB rules:** flexible and easy to change, but rule changes need governance.

**JSON batches:** simple for JavaScript, but XML is not supported.

**Single Express service:** easier to build, test, deploy, and explain in one day, but less independently scalable than microservices.

**No RBAC:** smaller implementation for the assessment; user ownership still protects parcel data.

## Future Improvements

- Controlled rule-management workflow
- Rule conflict detection
- Metrics and alerting
- Background processing for very large batches
- Pagination
- Distributed rate limiting
- More integration tests
- Production deployment hardening
