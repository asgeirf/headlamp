<!-- kapi:rules (written by kapi from this project's context; edit outside this section) -->
## Writing rules

These rules hold for every file in this project. Follow them as you write; you do not need to ask kapi first. kapi writes this section from the project's context and replaces it when the context changes, so edit outside it.

Say this, not that:
- Annotation: Not merknad.
- Backend: Not serverdel.
- BackendTLSPolicy: Gateway API kind, kept in English.
- BackendTrafficPolicy: Gateway API kind, kept in English.
- Cluster: A set of nodes managed by one Kubernetes control plane.
- Cluster Inventory: The SIG-Multicluster ClusterInventory API, named as a source.
- ConfigMap: Kubernetes kind, kept in English.
- Container: Not beholder.
- Cordon: Node action: Sperr for planlegging.
- CronJob: Kubernetes kind, kept in English.
- Custom Resource
- DaemonSet: Kubernetes kind, kept in English.
- Deployment: Kubernetes kind, kept in English. The act of deploying is utrulling.
- Drain: Node action.
- Egress: NetworkPolicy direction.
- Endpoint
- EndpointSlice: Kubernetes kind, kept in English.
- Event: Kubernetes event.
- Image: Container image. Not bilde.
- Ingresses: Ingress resources. As a NetworkPolicy direction, Ingress is inngående and Egress utgående.
- 29 more rules hold here: `kapi context <path>` lists them all.

Before you finish, run `kapi check <file>` on each file you changed and fix what it reports. `kapi context <path>` gives the full answer for one file when you need more than this section.
When the files keep to a name or a word this section does not list, record it with `kapi context note --term <used> --instead-of <avoided> --seen-in <file>`. A person decides what becomes a rule.
<!-- /kapi:rules -->
