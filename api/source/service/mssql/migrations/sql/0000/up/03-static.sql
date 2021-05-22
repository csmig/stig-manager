INSERT INTO [action] (actionId, api, en) VALUES (1,'remediate','Remediate'),(2,'mitigate','Mitigate'),(3,'exception','Exception');
INSERT INTO [result] (resultId, api, ckl, abbr, en) VALUES (1,'notchecked','Not_Reviewed','NR','Not checked'),
(2,'notapplicable','Not_Applicable','NA','Not Applicable'),
(3,'pass','NotAFinding','NF','Not a Finding'),
(4,'fail','Open','O','Open'),
(5,'unknown','Not_Reviewed','U','Unknown'),
(6,'error','Not_Reviewed','E','Error'),
(7,'notselected','Not_Reviewed','NS','Not selected'),
(8,'informational','Not_Reviewed','I','Informational'),
(9,'fixed','NotAFinding','NF','Fixed');
INSERT INTO [severity_cat_map] (id, severity, cat, roman) VALUES (1,'high',1,'I'),(2,'medium',2,'II'),(3,'low',3,'III'),(4,'mixed',4,'IV');
INSERT INTO [status] (statusId, api, en) VALUES (0,'saved','Saved'),
(1,'submitted','Submitted'),
(2,'rejected','Rejected'),
(3,'accepted','Accepted');
