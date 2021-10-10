Securing and Assessing STIG Manager Deployments
##########################################################

A STIG Manager application can be orchestrated several ways using container platforms ranging from docker-compose to Kubernetes and OpenShift. While we do not know the security requirements of your exact deployment scenario, we know many deployments must comply with the Application Security and Development STIG - commonly known as the ASD. Therefore we have organized this section around the ASD requirements and provide guidance for those tasked with securing and assessing a STIG Manager deployment for compliance with them.

.. note::
  The ASD assesses all application components and application governance using a single checklist comprising 286 checks (as of V5R1).  Unfortunately the current ASD provides limited guidance if you're using modern security technologies such as Single Sign On, OpenID Connect, OAuth2 authorization, and containerization. If you are required to complete an ASD assessment, we encourage focusing on the spirit of the checklist until it is updated or re-imagined.


API and Web Client
-------------

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


