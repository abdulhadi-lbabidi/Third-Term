# Authentication:
- login `/auth/login` components form {email or phone_number, password}
- register `/auth/register` components form {name, email, password, phone_number, address}
- forget password `/auth/forget-password` components form {email or phone_number}
- reset password `/auth/reset-password` components form {email or phone_number}

# Dashboard:

# HR:
<!-- Overview: cards statistics: [ total users, employees, engineers, daily workers, craftsmen, clients, suppliers, investors, trustees] -->

Users `/auth/reset-password`:
- reset password `/auth/reset-password` components form {email or phone_number}
- forms: [ create user, update user, reset password, update permissions, delete user]
- table:
- search[name, email,       phone_number]
- filters [email_verified_at, range date created_at, range date created_at, updated_at]

    Roles:

      Admins:
        - table details
        - details for one
        - update data

      Employees:
        - table details
        - details for one 
        - update job title
        - payroll history
        - update data

      Engineers:
        - table details
        - details for one
        - update job title
        - update base salary
        - update data

      Daily Workers:
        - table details
        - details for one
        - update data

      Craftsmen:
        - table details
        - details for one
        - update data

      Clients:
        - table details
        - details for one
        - projects
        - invoices
        - update data

      Suppliers:
        - table details
        - details
        - invoices
        - update data

    Investors:
      - table details
      - details
      - investment ratio

    Trustees:
      - table details
      - details
