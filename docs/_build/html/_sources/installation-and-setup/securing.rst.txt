Securing and Assessing STIG Manager Deployments
##########################################################

A STIG Manager application can be orchestrated several ways, each with unique security requirements. We know many deployments must comply with the Application Security and Development STIG - commonly known as the ASD. Therefore we have organized this section around ASD requirements, to provide guidance for those tasked with securing and assessing STIG-compliant STIG Manager deployments.

.. note::
  The ASD assesses many application components, and application governance, using a single checklist of 286 checks (as of V5R1).  Unfortunately, the current ASD provides limited guidance if you're using modern security technologies such as Single Sign On, OpenID Connect, OAuth2 authorization, and containerization. If you are required to complete an ASD assessment, we encourage focusing on the spirit of the checklist until it is updated or re-imagined.

Securing your deployment
========================

These are some common security topics to review when designing a secure STIG Manager application deployment.

Data Flow
---------

The STIG Manager API and Web Client exchange data across a REST architecture that enforces the STIG Manager `OpenAPI 3 Specification (OAS) definition <https://github.com/NUWCDIVNPT/stig-manager/blob/main/api/source/specification/stig-manager.yaml>`_.

The API grants or denies endpoint access based on the OAuth2 ``scope`` claims listed in each endpoint's ``security.oauth`` property in the OAS.

The API grants or denies access to STIG Manager data objects (Collections, Assets, Asset/STIG maps, and Reviews) based on the the OAuth2 ``username`` claim (or configured equivalent). The username value indexes into the internal STIG Manager discretionary access control (DAC) system which includes per-Collection role based access control (RBAC) lists (i.e, Collection Grants and Restricted User Access Lists). We have designed the access control logic with the goal of being assessed as ASD-compliant by local security requirements.

Both claims are contained in OAuth2 JWT formatted access_tokens issued by an OIDC Provider to remote clients, such as the Project's Web Client and the STIG Manager Watcher bot. Communication between the API and clients include the access_token and should occur using TLS but do not require Mutual TLS (MTLS).

Correct implementation of the STIG Manager data flow, especially the DAC and RBAC logic, is certified by `automated endpoint testing <https://github.com/NUWCDIVNPT/stig-manager/blob/main/.github/workflows/api-tests.yml>`_ that is performed when any change to the codebase is proposed (a Pull Request or PR). Over 2000 assertions are evaluated using `tests you can review here <https://github.com/NUWCDIVNPT/stig-manager/tree/main/test/api>`_

.. thumbnail:: /assets/images/data-flow-01b.svg
  :width: 75%
  :show_caption: True 
  :title: Data Flow Diagram

  
REST, OpenID Connect (OIDC), and OAuth2
---------------------------------------

Several ASD checks refer to SOAP, WS-Security and SAML, early protocols for implementing and securing online APIs. None of the checks refer to REST or OIDC/OAuth2, modern alternatives that are commonly used in cloud-native software such as STIG Manager. The checks that address SOAP, etc. state that if you aren't using those technologies, the assessment is 'not applicable'.

.. warning::
  You must secure your deployment in compliance with your individual security requirements. The discussion below is educational and does not address your specific requirements. It is assumed the reader has prerequisite knowledge of REST principles, `OAuth2 flows as defined in RFC 6749 <https://datatracker.ietf.org/doc/html/rfc6749>`_ and the `Open ID Connect Core 1.0 specification <https://openid.net/developers/specs/>`_



The Web Client on startup redirects users to the OIDC Provider to authenticate and obtain an access token that defines the level of API access the user grants that client. For most ASD-compliant deployments, the connection to the OIDC Provider's authorization_endpoint will use MTLS and CAC PKI.

The Web Client is a single-page application (SPA) that executes entirely in the browser. Browsers are low- to zero-trust environments where OAuth2 access tokens should have short lifetimes to mitigate the risk of token diversion. Just what is considered 'short' is for you (or your organization) to decide, but 15 minutes or even less is not uncommon.

Our Web Client will not engage in the OIDC implicit flow because it is not secure enough. To work with the Web Client, the OIDC Provider must provide tokens using the OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE). To work with bots such as STIG Manager Watcher, the OIDC Provider should support the client_credentials flow with Signed JWT authentication.

If your OIDC Provider issues refresh tokens (recommended for a better user experience), those tokens can have longer lifetimes than the access_token but should be rotated and limited to a single use. Policies vary greatly, but refresh token lifetime is sometimes correlated to the SSO session lifetime. Attempts to reuse a refresh_token should be logged by the OIDC Ppovider and generate alerts. 


User sessions
-------------

.. warning::
  You must secure your deployment in compliance with your individual security requirements. The discussion below is educational and does not address your specific requirements. It is assumed the reader has prerequisite knowledge of their specific OIDC Provider and any user federation or identify brokering features it is configured to use.

Several ASD checks address the management of user login sessions. It is important to understand how your OIDC Provider controls user sessions, performs user management, and audits its activities

Database
--------

.. warning::
  You must secure your deployment in compliance with your individual security requirements. The discussion below is educational and does not address your specific requirements. It is assumed the reader has prerequisite knowledge of the MySQL database and how to perform PKI user authentication (if required), secure data storage, and secure data backups.

Several ASD checks address the management of data storage. It is important to understand how to configure MySQL in accordance with local security requirements, such as the Oracle MySQL 8.0 STIG. Ideally, your organization will provision MySQL instances from a hardened cloud subscription that requires a smaller set of customer-responsible security settings.

Logging and Analysis
--------------------



Assessing your deployment
=========================

These are some common assessment topics to review when assessing a secure STIG Manager application deployment.


API and Web Client
------------------

About a third of the checks in the ASD assess application components provided by this Project - the API and Web Client. These checks assess both their behavior and how they are developed.

We have self-evaluated this portion of the checklist AS IF we were developer members of a deployed application's team. For most deployments, though, we are NOT part of your team and therefore the checks covering development practices might be properly evaluated as not applicable. Even in this case, however, we hope our self-evaluation provides useful insight into how the Project integrates security into our practice.

.. warning::
  You must evaluate your deployment independently in accordance with your individual security requirements. Our self-evaluation CANNOT and DOES NOT represent a valid assessment of your deployment!

You can download a CKL file containing our self-evaluations or view them here.

.. csv-table:: Table Title
  :file: asd-query-full.csv
  :widths: 10, 25, 25
  :header-rows: 1
  :stub-columns: 1
  :align: left
  :class: tight-table




- session management - concurrent, idle time, TOKEN LIFETIMES
- consent banner, logon sessions
- remote access encryption - REVERSE Proxy
- SOAP/WS-Security/SAML requirements translated to OAuth2: "OAuth 2.0 provides the same functionality for RESTful APIs as WS-Trust and WS-Security provide for SOAP web services"
- audit tools


