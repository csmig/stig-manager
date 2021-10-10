Securing and Assessing STIG Manager Deployments
##########################################################

A STIG Manager application can be orchestrated several ways, each with unique security requirements. We know many deployments must comply with the Application Security and Development STIG - commonly known as the ASD. Therefore we have organized this section around ASD requirements, to provide guidance for those tasked with securing and assessing STIG-compliant STIG Manager deployments.

.. note::
  The ASD assesses many application components, and application governance, using a single checklist of 286 checks (as of V5R1).  Unfortunately, the current ASD provides limited guidance if you're using modern security technologies such as Single Sign On, OpenID Connect, OAuth2 authorization, and containerization. If you are required to complete an ASD assessment, we encourage focusing on the spirit of the checklist until it is updated or re-imagined.

Securing your deployment
========================

These are some common security topics to consider when designing a secure STIG Manager application deployment.

REST, OpenID Connect (OIDC), and OAuth2
---------------------------------------

Several ASD checks refer to SOAP, WS-Security and SAML, early protocols for securing online APIs. None of the checks refer to REST or OIDC/OAuth2, modern alternatives that are commonly used in cloud-native software. The checks that address SOAP, etc. state that if you aren't using those technologies, the assessment is 'not applicable'.

.. warning::
  You must secure your deployment in compliance with your individual security requirements. The discussion below is educational and does not address your specific requirements.

The STIG Manager API and Web Client exchange data using a REST architecture. The API authorizes access to endpoints and data based on claims contained in OAuth2 JWT formatted tokens presented by remote clients, include the Project's Web Client. Communication between the clients and the API should occur using TLS but do not require Mutual TLS (MTLS).

The Web Client on startup redirects users to the OIDC Provider to authenticate and obtain an access token that can authorize the user to the API. For most ASD-compliant deployments, the connection to the OIDC Provider's authorization_endpoint will use MTLS and CAC PKI.

The Web Client is a single-page application (SPA) that executes entirely in the browser. Browsers are low- to no-trust environments where OAuth2 access tokens should have short lifetimes to mitigate the risk of token diversion. Just what is considered 'short' is for you (or your organization) to decide, but 15 minutes or less is not uncommon.

The Web Client will not engage in an OIDC implicit flow because it is insecure. To work with the Web Client, you must configure the OIDC Provider to provide tokens using the OIDC Authorization Code Flow with Proof Key for Code Exchange (PKCE). To work with bots such as 

If your OIDC Provider issues refresh tokens (recommended for a better user experience), those tokens can have longer lifetimes but should be limited to a single use. Policies vary greatly, but refresh token lifetime is sometimes correlated to the SSO session lifetime. The idea is that a diverted access token.

The Web Client should present the access token to the API over TLS, which mitigates the risk of token sniffing.




User sessions
-------------


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


