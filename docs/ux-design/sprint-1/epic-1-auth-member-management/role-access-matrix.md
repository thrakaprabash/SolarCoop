-# SOL-94 — Role-Based Access Matrix

**Epic:** Auth & Member Management  
**Jira Ticket:** SOL-94  
**Purpose:** Defines the screens and features available for each user role in the SolarShare mobile application.

| Feature / Screen        | Consumer | Solar Owner | Admin | Technician |
| :---------------------- | :------: | :---------: | :---: | :--------: |
| Personal Dashboard      |    ✓     |      ✓      |   ✓   |     ✓      |
| View Savings            |    ✓     |      ✓      |   ✗   |     ✗      |
| View Billing            |    ✓     |      ✓      |   ✗   |     ✗      |
| Energy Sharing          |    ✗     |      ✓      |   ✗   |     ✗      |
| Community Forum         |    ✓     |      ✓      |   ✓   |     ✗      |
| Admin Dashboard         |    ✗     |      ✗      |   ✓   |     ✗      |
| Member Management       |    ✗     |      ✗      |   ✓   |     ✗      |
| Approve / Block Members |    ✗     |      ✗      |   ✓   |     ✗      |
| Fault Alerts            |    ✗     |      ✗      |   ✓   |     ✓      |
| Maintenance Jobs        |    ✗     |      ✗      |   ✗   |     ✓      |
| Edit Own Profile        |    ✓     |      ✓      |   ✓   |     ✓      |
| Logout                  |    ✓     |      ✓      |   ✓   |     ✓      |

## Access Rules

- A user can access only the screens and features assigned to their role.
- Consumers can view their energy-related information, savings, bills, community discussions, and profile.
- Solar Owners can monitor and share excess solar energy in addition to viewing savings and billing information.
- Administrators can access the Admin Dashboard, manage members, approve or block members, and monitor fault alerts.
- Technicians can access fault alerts, maintenance jobs, and their own profile.
- All user roles can edit their own profile and log out securely.

## Legend

- ✓ = Access allowed
- ✗ = Access not allowed
