# Parcel Routing System

A small MERN-based parcel routing application built for a technical assessment. The system accepts parcel information, evaluates configurable business rules, routes the parcel to the appropriate department, records the decision, and provides a simple operator-facing UI.

The project is intentionally kept simple enough to build and explain in one day. It uses a **single Express/Node.js backend and MongoDB** rather than microservices.

---

## 1. Problem Statement

The delivery company receives parcels containing:

- Weight (kg)
- Value (€)
- Destination country
- Optional additional attributes

The default business rules are:

| Condition | Decision |
|---|---|
| Weight <= 1 kg | Mail Department |
| Weight <= 10 kg | Regular Department |
| Weight > 10 kg | Heavy Department |
| Value > €1,000 | Insurance approval required before normal routing |

The system should be easy to adapt when these rules change without rewriting the routing engine.

---

## 2. Main Goals

This project focuses on:

- Adaptable business rules
- Clear separation between HTTP/API code and routing logic
- Automated tests around the most important business behavior
- Validation and security for a public-facing API
- Auditability of routing decisions
- Useful logs and request IDs for investigation
- A simple UI suitable for non-technical operators
- Safe evolution of business rules
- Responsible use of AI during development

---

## 3. Technology Stack

### Frontend

- React
- Vite
- JavaScript
- React Router
- Axios
- Plain CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Joi
- JWT
- HTTP-only cookies
- bcryptjs
- Helmet
- CORS
- express-rate-limit
- Morgan

### Testing

- Jest

---

## 4. Architecture

The application uses a simple layered architecture:

```text
                         React Frontend
                              |
                              | HTTP / JSON
                              v
                       Express REST API
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
    Validation           Authentication       Controller
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                       Routing Service
                              |
                     Active Routing Rules
                              |
                              v
                           MongoDB
                         /    |     \
                        /     |      \
                   Parcels  Rules  AuditLogs
```

### Important design decision

The controller does not contain the business routing logic. It loads active rules and delegates the decision to `routing.service.js`.

This keeps responsibilities separate:

- **Routes** map URLs to handlers.
- **Middleware** handles authentication, validation, rate limiting, and errors.
- **Controllers** coordinate the HTTP request/response and persistence.
- **Routing service** evaluates business rules.
- **Models** represent MongoDB data.
- **Audit service** records routing decisions.
- **Logger** provides structured application logs.

---

## 5. Project Structure

```text
parcel-routing-system/
|
+-- client/
|   +-- src/
|       +-- components/
|       |   +-- ParcelForm.jsx
|       |   +-- BatchUpload.jsx
|       |   +-- RoutingResult.jsx
|       |
|       +-- pages/
|       |   +-- Login.jsx
|       |   +-- Dashboard.jsx
|       |
|       +-- services/
|           +-- api.js
|       |
|       +-- App.jsx
|       +-- main.jsx
|       +-- index.css
|       +-- package.json
|
+-- server/
|   +-- models/
|   |   +-- User.js
|   |   +-- Parcel.js
|   |   +-- RoutingRule.js
|   |   +-- AuditLog.js
|   |
|   +-- routes/
|   |   +-- auth.routes.js
|   |   +-- parcel.routes.js
|   |
|   +-- controllers/
|   |   +-- auth.controller.js
|   |   +-- parcel.controller.js
|   |
|   +-- services/
|   |   +-- routing.service.js
|   |   +-- audit.service.js
|   |
|   +-- middleware/
|   |   +-- auth.js
|   |   +-- validate.js
|   |   +-- errorHandler.js
|   |
|   +-- validators/
|   |   +-- parcel.validator.js
|   |
|   +-- utils/
|   |   +-- logger.js
|   |
|   +-- seed/
|   |   +-- seedRules.js
|   |
|   +-- tests/
|   |   +-- routing.test.js
|   |
|   +-- app.js
|   +-- server.js
|   +-- package.json
|   +-- .env.example
|
+-- README.md
```

There is deliberately **no RBAC layer** and no microservice split. The assessment only needs authentication, not role-specific authorization.

---

## 6. Routing Engine Design

Rules are stored as data in MongoDB instead of hardcoding every business condition inside the controller.

Example rules:

```javascript
[
  {
    name: "Insurance approval above 1000",
    type: "GATE",
    field: "value",
    operator: ">",
    value: 1000,
    action: "INSURANCE_APPROVAL",
    priority: 1,
    enabled: true,
    version: 1
  },
  {
    name: "Mail up to 1kg",
    type: "ROUTING",
    field: "weight",
    operator: "<=",
    value: 1,
    action: "MAIL",
    priority: 10,
    enabled: true,
    version: 1
  },
  {
    name: "Regular up to 10kg",
    type: "ROUTING",
    field: "weight",
    operator: "<=",
    value: 10,
    action: "REGULAR",
    priority: 20,
    enabled: true,
    version: 1
  },
  {
    name: "Heavy above 10kg",
    type: "ROUTING",
    field: "weight",
    operator: ">",
    value: 10,
    action: "HEAVY",
    priority: 30,
    enabled: true,
    version: 1
  }
]
```

### Rule evaluation flow

```text
Parcel
  |
  v
Load enabled rules
  |
  v
Sort by priority
  |
  v
Check GATE rules first
  |
  +---- Match? ---- Yes ---> INSURANCE_REQUIRED
  |
  No
  |
  v
Check ROUTING rules
  |
  +---- First match ---> Department
  |
  No match
  |
  v
FAILED
```

### Why use gate rules?

A parcel worth more than €1,000 must receive insurance approval before normal routing. Therefore insurance is treated as a **pre-routing gate** rather than another department.

For example:

```text
weight = 5 kg
value  = €1,500

5 <= 10           -> Regular would normally match
€1,500 > €1,000   -> Insurance gate matches first

Final decision -> INSURANCE_REQUIRED
```

---

## 7. Why Rules Are Configurable

A hardcoded implementation would look like:

```javascript
if (value > 1000) {
  // insurance
} else if (weight <= 1) {
  // mail
} else if (weight <= 10) {
  // regular
} else {
  // heavy
}
```

That works for the current requirements but becomes harder to maintain when the business changes.

With the rule-based design, a change such as:

```text
Mail limit: 1 kg -> 2 kg
```

can be represented by changing the rule data rather than rewriting the routing algorithm.

A new department can also be added through a new routing rule without adding another large conditional block to the controller.

---

## 8. Safe Rule Changes

Business rules are operationally important. A wrong rule can route many parcels incorrectly, so changing rule configuration should not be treated like arbitrary user input.

In production, rule changes should follow a controlled workflow:

1. Propose the rule change.
2. Validate the rule structure and allowed fields/operators.
3. Add or update automated tests for boundary cases.
4. Review the change through pull request/code review or an approved configuration workflow.
5. Version the rule.
6. Deploy or activate the change in a controlled manner.
7. Monitor routing outcomes after the change.
8. Keep the previous rule version available for investigation or rollback.

For this assessment, the rules are seeded into MongoDB and are read as configuration; the application intentionally does not expose an unrestricted public endpoint for editing rules.

---

## 9. Data Models

### User

Stores:

- Name
- Email
- Password hash

Passwords are never stored in plaintext.

### Parcel

Stores:

- Weight
- Value
- Destination country
- Optional attributes
- Department
- Routing status
- Insurance-required flag
- Matched rule
- Rule version
- Routing error
- Timestamps

### RoutingRule

Stores:

- Rule name
- Rule type (`GATE` or `ROUTING`)
- Field to evaluate
- Operator
- Expected value
- Action
- Priority
- Enabled/disabled state
- Rule version

### AuditLog

Stores:

- Parcel ID
- Action
- Status
- Department
- Matched rule
- Rule version
- Request ID
- Additional details
- Timestamp

---

## 10. API Endpoints

### Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Login and issue JWT cookie |
| POST | `/api/auth/logout` | Clear the JWT cookie |
| GET | `/api/auth/me` | Get current authenticated user |

### Parcels

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/parcels` | Route one parcel |
| POST | `/api/parcels/batch` | Process a batch of parcels |
| GET | `/api/parcels` | Get recent parcels |
| GET | `/api/parcels/:id` | Get one parcel |
| GET | `/api/parcels/rules` | View active routing rules |

### Health

```http
GET /health
```

Example response:

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "..."
}
```

---

## 11. Authentication

Authentication uses JWT stored in an **HTTP-only cookie**.

Login flow:

```text
User submits email/password
        |
        v
Find user in MongoDB
        |
        v
Compare password with bcrypt
        |
        v
Generate JWT
        |
        v
Set HTTP-only cookie
```

Why an HTTP-only cookie?

- JavaScript in the browser cannot directly read the token.
- It reduces exposure of the token to client-side scripts.
- The browser sends the cookie automatically with authenticated requests.

The frontend Axios client therefore uses:

```javascript
withCredentials: true
```

---

## 12. Input Validation

The backend uses Joi validation before controller logic runs.

A reusable middleware accepts a Joi schema:

```javascript
router.post(
  "/",
  validate(parcelSchema),
  createParcel
);
```

Validation checks include:

- Weight must be numeric and non-negative.
- Value must be numeric and non-negative.
- Destination country must be a short country code.
- Unknown fields are removed.
- Batch size is limited to 1,000 parcels.

Validation errors return HTTP 400.

The frontend also performs basic validation for a better operator experience, but the backend remains the final validation boundary because client-side validation can be bypassed.

---

## 13. Batch Upload

The UI supports uploading a JSON file through the browser.

Example file:

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
  },
  {
    "weight": 15,
    "value": 500,
    "destinationCountry": "US"
  },
  {
    "weight": 5,
    "value": 1500,
    "destinationCountry": "DE"
  }
]
```

The frontend parses the selected JSON file and sends:

```json
{
  "parcels": [
    {
      "weight": 0.5,
      "value": 200,
      "destinationCountry": "IN"
    }
  ]
}
```

to:

```http
POST /api/parcels/batch
```

### Why JSON instead of XML?

JSON was chosen because:

- It maps naturally to JavaScript objects.
- React and Node.js handle it directly.
- It is simpler for operators to inspect and create.
- It avoids adding XML parsing complexity for a small assessment.

The frontend currently limits files to 1 MB and the backend batch design limits the number of parcels to 1,000.

---

## 14. Monitoring and Reliability

The system uses several lightweight mechanisms to make failures easier to investigate.

### Structured logs

The logger records information such as:

```json
{
  "timestamp": "...",
  "level": "INFO",
  "message": "Audit log created",
  "requestId": "...",
  "parcelId": "...",
  "action": "PARCEL_ROUTED",
  "status": "ROUTED"
}
```

### Request ID

Each request receives a unique ID and the API returns it through the `X-Request-ID` header.

This allows an operator or developer to connect:

```text
HTTP request
   -> application logs
   -> parcel record
   -> audit log
```

### Audit logging

Each routing attempt records:

- What happened
- Which rule matched
- Which rule version was used
- What department was selected
- Which request caused the decision

### Health endpoint

`GET /health` provides a simple liveness check.

### Failure behavior

If no rule matches, the system records `FAILED` instead of silently choosing a department.

For infrastructure-level failures, the centralized error handler logs the server-side error and returns a safe response to the client.

### Detecting unusual business patterns

The stored parcel and audit data can later be aggregated to detect patterns such as:

- Sudden increase in `FAILED` decisions
- Unexpected increase in `INSURANCE_REQUIRED`
- Large changes in department distribution
- High batch failure rates

For a production deployment, these metrics would feed dashboards and alerts.

---

## 15. Security

The application is designed for public internet exposure and includes several baseline protections.

### Implemented

- Helmet for secure HTTP headers
- CORS with an explicit frontend origin
- HTTP-only JWT cookie
- bcrypt password hashing
- Authentication middleware
- Global rate limiting
- Stricter rate limiting for authentication endpoints
- Joi input validation
- Unknown field removal
- Request body size limits
- Browser-side file size/type checks for batch upload
- No stack traces returned in production responses
- Secrets stored in environment variables
- `x-powered-by` disabled

### Additional production measures

The following would be added or strengthened for a production deployment:

- HTTPS everywhere
- Strong secret management through a dedicated secrets manager
- Shorter JWT lifetime plus a refresh-token strategy where appropriate
- CSRF protection if cookie-based authentication is used across the relevant deployment model
- Strong password policy and account lockout/step-up protections
- Centralized log aggregation and alerting
- Database backups and tested restore procedures
- More restrictive MongoDB network access
- Dependency and vulnerability scanning
- Security headers and CORS review for the actual production domains
- Malware/content scanning if arbitrary files are later accepted
- Distributed rate limiting if multiple application instances are deployed

---

## 16. Error Handling

Errors are handled centrally in `errorHandler.js`.

The API returns a consistent structure such as:

```json
{
  "success": false,
  "message": "Internal server error",
  "requestId": "..."
}
```

The request ID is useful for finding the corresponding server log.

The application avoids exposing stack traces to production clients.

---

## 17. Testing Strategy

The most important automated tests are around the routing engine because business-rule regressions are the highest-risk application bugs.

Current boundary scenarios include:

| Input | Expected result |
|---|---|
| Weight 1 kg | MAIL |
| Weight 1.01 kg | REGULAR |
| Weight 10 kg | REGULAR |
| Weight 10.01 kg | HEAVY |
| Value €1,000 | Normal routing |
| Value €1,000.01 | INSURANCE_REQUIRED |

The routing service is tested independently from MongoDB and HTTP handling. This makes tests fast and deterministic.

### Run tests

From the `server` folder:

```bash
npm test
```

The project uses ES modules, so the Jest script is configured with Node's VM module support.

---

## 18. How Tests Protect Against Regression

Consider a future change where someone accidentally changes:

```javascript
value > 1000
```

to:

```javascript
value >= 1000
```

The boundary test for exactly €1,000 would fail.

Similarly, a change from:

```javascript
weight <= 10
```

to:

```javascript
weight < 10
```

would cause the 10 kg test to fail.

This makes the tests executable business specifications for the most important edge cases.

---

## 19. Safe Feature Development Example

Example feature: **Add Oversized Department for parcels above 20 kg**.

### Branch

```bash
git checkout -b feature/oversized-routing
```

### Development steps

1. Add a new routing-rule fixture or seed rule.
2. Add tests for 20 kg and 20.01 kg boundaries.
3. Run the full test suite.
4. Verify the API manually using Postman.
5. Verify the dashboard displays the new department.
6. Review the diff.
7. Merge the pull request.

Example tests should include:

```text
20 kg    -> existing applicable rule
20.01 kg -> OVERSIZED
```

The goal is to make a rule change observable through tests before it reaches production.

---

## 20. Manual Validation Beyond Automated Tests

Automated tests are necessary but not sufficient.

Before a release I would also perform:

### API checks

Use Postman/Thunder Client to verify:

- Register
- Login
- `/auth/me`
- Logout
- Create parcel
- Batch processing
- Validation failures
- Unauthorized access

### Boundary testing

Manually verify:

```text
1 kg
1.01 kg
10 kg
10.01 kg
€1,000
€1,000.01
```

### UI testing

Verify:

- Clear routing result
- Field validation
- Error messages
- Batch upload
- Mobile/responsive layout
- Loading states

### Failure testing

Simulate or verify:

- Missing authentication cookie
- Invalid JSON
- Empty batch
- Batch greater than 1,000 items
- Database unavailable
- No active routing rules

---

## 21. Debugging Approach

For a buggy routing function, the debugging approach is:

1. Reproduce the bug with the smallest failing input.
2. Check boundary conditions.
3. Trace rule ordering and rule types.
4. Confirm the actual value being compared.
5. Compare expected and actual routing decisions.
6. Fix the smallest possible area.
7. Add a regression test before merging.

For example, if €1,000 is incorrectly sent to insurance, first inspect whether the implementation uses:

```text
>
```

or:

```text
>=
```

for the insurance condition.

---

## 22. AI-Assisted Development

AI tools were used during development, but the generated code was reviewed, modified, tested, and integrated manually.

### Areas where AI was used

1. Initial backend architecture and folder structure
2. Routing service and rule evaluation design
3. Joi validation middleware
4. Authentication and security scaffolding
5. React form and dashboard scaffolding
6. Test-case generation and boundary-case analysis
7. Debugging issues such as ES module/Jest configuration and rule-model field mismatches

### Example prompts used

#### Prompt 1 - Architecture

```text
Design a small MERN-based parcel routing system for a technical assessment.
Keep it simple enough to build in one day, avoid microservices, and cover
configurable routing rules, validation, testing, monitoring, reliability,
security, batch input, and auditability.
```

#### Prompt 2 - Rule engine

```text
Design a routing service that evaluates configurable rules for weight and
value. Insurance rules must be checked before department routing. Avoid eval()
and make it easy to add new departments without rewriting the controller.
```

#### Prompt 3 - Testing

```text
Generate Jest tests for parcel routing boundary cases including 1 kg,
1.01 kg, 10 kg, 10.01 kg, exactly €1,000, and values above €1,000.
```

#### Prompt 4 - Debugging

```text
The API returns routingStatus as ROUTED even though an insurance rule matched.
The routing service returns routingStatus but the controller/model may use a
different property name. Identify the mismatch and explain the fix.
```

### What was modified after AI generation?

Generated code was adapted to the actual project structure and constraints. In particular:

- Removed RBAC because it was unnecessary for the assessment.
- Kept a single service instead of microservices.
- Changed imports/paths to match the actual project layout.
- Used ES modules with `import`/`export`.
- Added request IDs and structured logging.
- Added rule version information for auditability.
- Adjusted the batch API to match the React upload flow.
- Corrected the `status` vs `routingStatus` field mismatch.
- Added explicit boundary tests.

### AI limitations

AI can produce code that is syntactically valid but architecturally inconsistent with the rest of the project. Examples include:

- Incorrect file paths
- Inconsistent field names
- Missing edge cases
- Security assumptions that need validation
- Test cases that do not reflect actual requirements
- Configuration examples that do not match the local environment

For that reason, generated code was treated as a starting point rather than as automatically correct code.

---

## 23. Trade-offs

### MongoDB for rules

**Benefit:** easy to represent configurable rule documents and extend them with new fields.

**Trade-off:** rule configuration becomes runtime data, so production changes require a controlled governance process.

### JSON instead of XML

**Benefit:** simpler React/Node.js integration and less parser complexity.

**Trade-off:** XML inputs are not currently supported.

### Single service instead of microservices

**Benefit:** much simpler deployment, debugging, local development, and interview demonstration.

**Trade-off:** less independent scaling or deployment isolation compared with a microservice architecture.

### HTTP-only cookies instead of localStorage JWT

**Benefit:** reduces direct JavaScript access to the token.

**Trade-off:** cookie-based authentication requires careful CORS, cookie, and CSRF design for a production deployment.

### Simple audit logging

**Benefit:** enough history to explain routing decisions without introducing a distributed event system.

**Trade-off:** for high-volume production systems, audit data may need dedicated retention and storage strategies.

---

## 24. Running the Project Locally

### Backend

```bash
cd server
npm install
```

Create `.env` from `.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/parcel-routing
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Seed the default rules:

```bash
npm run seed:rules
```

Start the backend:

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 25. Demo Flow

A short 10-15 minute demonstration can follow this order:

### 1. Login

Show cookie-based authentication.

### 2. Manual routing

Enter:

```text
0.5 kg, €200 -> MAIL
5 kg, €500   -> REGULAR
15 kg, €500  -> HEAVY
5 kg, €1500  -> INSURANCE_REQUIRED
```

### 3. Batch upload

Upload a JSON file containing multiple parcels and show the summary.

### 4. Show active rules

Demonstrate that the routing behavior comes from rule configuration.

### 5. Live change

Change a rule in the controlled configuration and demonstrate the corresponding routing behavior.

### 6. Tests

Run:

```bash
npm test
```

Explain the boundary cases.

### 7. Reliability/security

Briefly explain:

- Request IDs
- Audit logs
- Rate limiting
- Helmet
- Joi validation
- HTTP-only cookies
- Centralized error handling

---

## 26. Example End-to-End Flow

```text
Operator enters parcel
        |
        v
React ParcelForm
        |
        | POST /api/parcels
        v
Express route
        |
        v
Authentication middleware
        |
        v
Joi validation middleware
        |
        v
Parcel controller
        |
        v
Load enabled routing rules
        |
        v
Routing service
        |
        +---- Gate rule matched?
        |          |
        |          +---- YES -> INSURANCE_REQUIRED
        |          |
        |          NO
        |          |
        +---- Routing rules
                   |
                   +---- MAIL / REGULAR / HEAVY
                   |
                   v
              Save parcel
                   |
                   v
              Audit log
                   |
                   v
             JSON response
                   |
                   v
             React result UI
```

---

## 27. Future Improvements

With more time, the following could be added:

- Rule management UI with approval workflow
- Rule change history and rollback
- Dedicated metrics endpoint
- Centralized logs and alerting
- Background batch processing for very large files
- Pagination for parcel history
- Redis-backed distributed rate limiting
- More comprehensive integration tests
- Production deployment with HTTPS and managed secrets

These are intentionally outside the one-day scope of the assessment.

---

## 28. Conclusion

The project deliberately favors **clear engineering decisions over excessive complexity**.

The main design principle is:

> Keep the routing engine independent from the HTTP layer and represent business rules as structured data so the system can evolve safely.

This keeps the application small enough to understand completely while still demonstrating adaptability, testing discipline, observability, reliability, security, and responsible AI-assisted development.
