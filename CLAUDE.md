<!-- kapi:rules (written by kapi from this project's context; edit outside this section) -->
## Writing rules

These rules hold for every file in this project. Follow them as you write; you do not need to ask kapi first. kapi writes this section from the project's context and replaces it when the context changes, so edit outside it.

Say this, not that:
- Access Mode: How a volume can be mounted: read-write by one node, read-only by many, and so on.
- Affinity: Rules that attract a pod to, or keep it from, nodes or other pods.
- Allocatable: The resources of a node available to pods.
- Annotation: A key-value pair on an object for tools and people, not for selection.
- Backend: The Service or endpoint that a route or Ingress forwards traffic to.
- BackendTLSPolicy: The Gateway API BackendTLSPolicy kind: TLS settings from a gateway to a backend.
- BackendTrafficPolicy: The Gateway API BackendTrafficPolicy kind: traffic settings for a backend.
- Capacity: The total resources of a node.
- Claim: A request for a resource, as in a persistent volume claim.
- Cluster: A set of nodes run by one Kubernetes control plane.
- Cluster Inventory: The SIG-Multicluster ClusterInventory API, named as a source of clusters.
- Condition: A status entry that reports one aspect of an object's state.
- ConfigMap: The Kubernetes ConfigMap kind: non-secret configuration as key-value pairs.
- Container: A packaged process with its own filesystem, run from an image.
- Container Runtime: The software on a node that runs containers.
- Context: A named cluster, user and namespace combination in a kubeconfig.
- Cordon: Marking a node so no new pods are scheduled on it.
- CronJob: The Kubernetes CronJob kind: Jobs run on a schedule.
- Custom Resource: An object of a type that extends the Kubernetes API.
- Custom Resource Definition: An object that adds a custom resource type to the API.
- 67 more rules hold here: `kapi context <path>` lists them all.

Before you finish, run `kapi check <file>` on each file you changed and fix what it reports. `kapi context <path>` gives the full answer for one file when you need more than this section.
When the files keep to a name or a word this section does not list, record it with `kapi context note --term <used> --instead-of <avoided> --seen-in <file>`. A person decides what becomes a rule.
<!-- /kapi:rules -->
