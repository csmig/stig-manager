.. _roles-and-access:


Collection Grants, Roles, Access, and User Groups
####################################################

STIG Manager uses a Role-Based Access Control (RBAC) system to manage access to Collections.  This system allows the Collection Owner or Manager to Grant Users a Role in their Collection, and then assign Access Controls to those Grants.


.. note:: 

  The Collection Roles and Access are distinct from the overall Application Privileges, which are managed by the configured OIDC Identity Provider. Collection Grants, Roles, and Access are specific to each Collection and its contents.


Grants
--------------------------------------------------------

A Grant is a record of a User or User Group being given a Role in a Collection.  A User/Group can have Grants in multiple Collections, and have different Roles in each Collection. Collection Owners and Managers can create, modify, and remove Collection Grants for Users and Groups, controlling access to their Collection.

Grants are composed of the following elements:
  - Grantee: The User or Group who is being granted a Role in the Collection.
  - Role: The Role that the Grantee is being given in the Collection.
  - Access Controls: The Access Controls that define what Assets and STIGs the Grantee can see and Evaluate in the Collection.


Roles
--------------------------------------------------------

There are four Roles available in STIG Manager, defined below. Roles differ in the actions they can perform in a Collection, and their default Access to Assets and Reviews. 

Each Role in STIG Manager combines two distinct aspects:
- Collection Management Capabilities (Privileges): Actions the user can perform on the Collection itself.
- Default Access: The base level of access granted to Assets and their Reviews. This access can be further refined with Access Controls.

The following Collection Roles are available:

.. list-table:: Role Capabilities and Access 
    :widths: 20 40 40 
    :header-rows: 1
    :class: tight-table

    * - Role
      - Collection Management Capabilities  
      - Default Access
    * - Owner
      - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants. Can delete the Collection.
      - Full access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Manage
      - Add/Remove/Modify Assets, STIG assignments, Labels, and User Grants with the exception of "Owner" grants. Optionally responsible for "Accepting" and "Rejecting" reviews from evaluators.
      - Full access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Full
      - None
      - Full access to all Assets/Reviews (Can be restricted with Access Controls)
    * - Restricted
      - None
      - None (Access to Assets derived solely from Access Controls configured by Owner or Manager)


Access Control Rules
--------------------------------------------------------

Access Controls Rules allow fine-grained management of what Assets and STIGs users can see and Evaluate in a Collection. They are particularly important for users with the Restricted role, as these users have no default access and rely entirely on Access Controls to perform their work.

Access Controls can be defined based on any combination of the following elements:
  - **Assets**: Specific Assets in the Collection
  - **STIGs**: Security Technical Implementation Guides assigned to Assets
  - **Labels**: Tags that group Assets together

The level of Access to the resources defined by the above elements can be set to one of three levels:
  - **Read**: Can view reviews and results
  - **Read/Write**: Can create and modify reviews
  - **None**: No access (Restricted role only)

Access Controls can be applied to individual Assets, STIGs, or Labels, and can be combined to create complex access rules. For example, a user could be granted Read access to all Assets with the "Database" label, and Read/Write access to the "PostgreSQL_9-x_STIG" STIG. This will have the effect of letting the user view all reviews for all STIGs assigned to "Database" Assets, but only create and modify reviews for the PostgreSQL STIG on those Assets.


Access Control Priority
--------------------------------------------------------

When multiple Access Controls apply to the same Asset or STIG, the following rules determine the final access level:

1. The most specific resource takes precedence (e.g., direct Asset access overrides Label-based access)
2. When access levels conflict, the most restrictive access level is applied
3. Direct Grants to Users take precedence over any Grant to a Group the User belongs to
4. When a user belongs to multiple Groups, the Grant with the highest priority Role is selected

These controls allow Collection Owners and Managers to precisely define who can access what within their Collection.
The Users tab in the Manage Collection interface provides a granular view of the effective access for each User in the Collection, based on their Grants and Access Controls.


Examples?
--------------------------------------------------------




.. list-table:: Effective Access Example
    :widths: 40 40 40 40 40 40
    :header-rows: 1
    :class: tight-table

    * - Asset 
      - Label
      - STIG
      - Asset/STIG  
      - Label/STIG
      - Effective Access
    * - Read Only
      - Read/Write
      - NA
      - R
      - None
      - Read/Write for All Assets with label, Read Only for specified Asset, cannot see STIG X for Assets with Label Y