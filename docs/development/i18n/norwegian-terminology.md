---
title: Norwegian Bokmål Terminology
sidebar_label: Norwegian terminology
---

This page records the research behind Headlamp's Norwegian Bokmål (`nb`)
translation: the Norwegian word chosen for each Kubernetes and UI concept, and
the usage each choice rests on.

The approved terms are kept in `.kapi/terms.json`, and `kapi check --ship`
checks the translations against them (see
[Translating with kapi](./contributing.md#translating-with-kapi)). Each
concept in that file has a definition, the reason for the Norwegian choice as
a note on the Norwegian term, and the evidence from its row below under
`properties`. This page also covers words that are not in the terms file:
compounds built from the terms, and general UI verbs and labels.

## Sources

The survey was made in October 2026. It compared how Norwegian product
translations and Norwegian engineers name each concept:

- [Kartverket SKIP](https://skip.kartverket.no/docs/), the Norwegian-language
  documentation for the Norwegian Mapping Authority's Kubernetes platform. It
  shows how Norwegian engineers write about Kubernetes in practice.
- Microsoft's Norwegian Azure pages on Kubernetes (Azure nb-NO).
- The Norwegian catalogs of GitLab (including its Kubernetes dashboard),
  Proxmox, Cockpit and Cockpit Machines.
- [Bokmålsordboka](https://ordbokene.no/) for the spelling and inflection of
  loanwords such as pod, container and image.
- Other open source Norwegian catalogs for single words: KDE Plasma, GNOME
  GLib, Picard, WinMerge, Joplin, RustDesk, Motrix and Doxygen, and Digdir's
  DCAT-AP-NO standard.
- Headlamp's own Swedish and German catalogs, as context for how a related
  language handled a string. They are not treated as an authority: the
  Swedish file has some mistranslations, such as «Gör anspråk» for Claim,
  «Bifoga» for Attach and «Spår» for Taint.

In the Evidence column, an entry that starts with "contra" is a source that
uses a different word. "convention" marks a choice made where no Norwegian
source was found, and "derived" marks a compound built from other choices.

## Principles

- Kubernetes kinds stay in English: Deployment, ReplicaSet, StatefulSet,
  DaemonSet, ConfigMap, CronJob, Lease, LimitRange, EndpointSlice, JobSet and
  the Gateway API kinds. Where the English splits a kind into words ("Stateful
  Sets"), the translation writes the kind (StatefulSets). These are the names
  a user types in YAML and kubectl, and Norwegian engineers write them as they
  are.
- A general concept is translated when Norwegian product translations agree
  on a word: klynge, navnerom, tjeneste, hemmelighet, hendelse, jobb.
- A dictionary loanword is preferred to a native word that reads as something
  else: container rather than beholder, image rather than bilde, backend
  rather than serverdel.
- Where Norwegian engineers keep an English word in prose but product
  translations translate it, as with cluster, the UI follows the product
  translations.

## Style

- Sentence case for labels, titles and buttons: "Add Cluster" is «Legg til
  klynge». Proper nouns and kinds keep their capitals.
- The imperative for buttons and actions («Slett», «Lagre»), and «du» to
  address the user.
- Compounds are written as one word («klyngeinnstillinger», «nodevelger»). A
  compound with an English name, an acronym or a number takes a hyphen
  («Kubernetes-versjon», «pod-IP», «CPU-grenser»).
- Norwegian quotation marks «…» in prose. Quotes that are part of code, YAML or
  a command stay as they are.
- The ellipsis character … where the English has it, with no space before it.
- Product and technology names stay as they are: Headlamp, Kubernetes, Helm,
  OIDC, YAML, kubectl, Prometheus, Flux.
- `_one` and `_other` keys get the Norwegian singular and plural
  («`{{count}}` klynge» and «`{{count}}` klynger»). A `//context:` suffix on a
  key tells the sense of the string and is not translated.

## Research

The In English column is Yes when the term stays in English and Partly when a
kind or an acronym stays inside a Norwegian phrase.

### Clusters, nodes and namespaces

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Cluster | klynge (klyngen, klynger, klyngene) |  | Every nb localization found uses klynge. Norwegian engineers write cluster/clusteret in prose (SKIP: 0 x klynge). Translate in UI; compounds: klyngenavn, klyngerolle, Klynge-IP | [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) (klynge/klyngen/klynger 50+x); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Cluster=>Klynge, 'Add Kubernetes cluster'=>'Legg til Kubernetes-klynge'; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Cluster=>Klynge; [Bokmålsordboka](https://ordbokene.no/nob/bm/klynge); contra [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/logge-inn-p%C3%A5-cluster) 'Logg inn på clusteret' (SKIP 36x clusteret) |
| Cluster selector | klyngevelger |  | Follows Cluster + Selector decisions | convention (no nb source found) |
| Cluster IP | klynge-IP | Partly | Service field; IP stays | derived from Cluster |
| Node | node (noden, noder, nodene) |  | Same spelling as English; Norwegian inflection. All sources agree | [Bokmålsordboka](https://ordbokene.no/nob/bm/node); [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Node/Nodes=>Node/Noder; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Nodes=>Noder; [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) noder/arbeidsnoder |
| Node Pool | nodepool (nodepoolen, nodepooler, nodepoolene) | Partly | pool is used untranslated in nb UIs | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Pool/Pools=>Pool/Pooler; [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po) 'Storage pools'=>'Lagrings-pooler' |
| Node Selector | nodevelger (pl. nodevelgere) |  | Selector=velger; field name nodeSelector stays in YAML | Headlamp sv/glossary.json 'Val av nod'; convention |
| Namespace | navnerom (navnerommet, navnerom, navnerommene) |  | Contested. Two nb terms exist: navnerom (Digdir standards, doxygen, GitLab plural, SKIP when it translates) and navneområde (Microsoft, GNOME). Chose navnerom: shorter, compounds well (navneromsvelger), parallels sv namnrymd/de Namensraum. Norwegian engineers mostly keep 'namespace/namespacet' (SKIP ~260x vs 3x navnerom); acceptable fallback is to keep Namespace | [Digdir DCAT-AP-NO](https://github.com/Informasjonsforvaltning/dcat-ap-no) (docs/Navnerom.adoc) 'Navnerom'; [Doxygen](https://github.com/doxygen/doxygen/blob/master/src/translator_no.h) 'Navnerom'; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Namespaces=>Navnerom (but Namespace=>Navnefelt, 'Namespace:'=>Navneområde); [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/argokit/argokit-v1) 'dette navnerommet'; contra [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) 'navneområde/navneområder', [GNOME GLib nb](https://gitlab.gnome.org/GNOME/glib/-/blob/main/po/nb.po) navneområde; [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/jobbe-med-cluster) 'Podder som kjører i et namespace' |
| Namespace Selector | navneromsvelger |  | Compound of Namespace + Selector | derived |

### Pods, containers and images

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Pod | pod (poden, podder, poddene) | Partly | Keep the API spelling 'pod' in singular; plural podder/poddene per dictionary. Reject 'poder' (only an older Microsoft page) and 'podd' spelling (= podcast). Definite singular: dictionary gives 'podden', SKIP writes 'poden'; prefer 'poden' to avoid podcast reading | [Bokmålsordboka](https://ordbokene.no/nob/bm/podd) (pod: podden, podder, poddene); [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) podder/poddene 35x; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'Pods in use'=>'Podder som brukes'; [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/jobbe-med-cluster) 'Podder som kjører i et namespace'; [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/helsesjekker-i-kubernetes) 'poden'; contra [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) 'poder' |
| Pod Selector | podvelger |  | Compound | derived |
| Pod IP / Pod CIDR | pod-IP / pod-CIDR | Partly | Hyphenate with the acronym | convention |
| Container | container (containeren, containere, containerne) | Yes | Contradicts Microsoft/Proxmox 'beholder'. container is a dictionary-sanctioned nb loanword and what Norwegian engineers write; 'beholder' reads as a generic vessel. Compounds: containerkjøretid, containerspesifikasjon | [Bokmålsordboka](https://ordbokene.no/nob/bm/container) (containeren, containere, containerne); [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/helsesjekker-i-kubernetes) 'containere i poden'; [Folq](https://www.folq.no/kubernetes/); [qtips](http://qtips.github.io/2019/07/kubernetes-basics); contra [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) [Azure nb-NO](https://azure.microsoft.com/nb-no/products/container-registry) 'beholder(e)', [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Container=>Beholder |
| Containers | containere | Yes | Plural of container | [Bokmålsordboka](https://ordbokene.no/nob/bm/container); [Kartverket SKIP](https://skip.kartverket.no/docs/) |
| Ephemeral Containers | flyktige containere | Partly | ephemeral=flyktig | convention (no nb source found) |
| Container Runtime | containerkjøretid | Partly | runtime=kjøretid | Headlamp sv/glossary.json Containerkörning; convention (no nb source found) |
| Container Spec | containerspesifikasjon | Partly |  | convention (no nb source found) |
| Image | image (imaget, imager, imagene) | Yes | Contradicts Microsoft 'beholderbilde/bilde'. 'bilde' alone reads as picture (GitLab uses it for picture images). Norwegian engineers write image/imaget. Neuter gender | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/argo-cd/hva-er-et-apps-repo) 'imaget' (SKIP 20x imaget, 0x beholderbilde); [Folq](https://www.folq.no/kubernetes/) 'container-images'; [qtips](http://qtips.github.io/2019/07/kubernetes-basics) 'Imaget'; [Bokmålsordboka](https://ordbokene.no/nob/bm/image) (imaget, imager); contra [Azure nb-NO](https://azure.microsoft.com/nb-no/products/container-registry) 'beholderbilder', Headlamp sv/glossary.json Bild |
| Images | imager | Yes | Plural; 'images' also seen in SKIP | [Bokmålsordboka](https://ordbokene.no/nob/bm/image); [Kartverket SKIP](https://skip.kartverket.no/docs/) |
| Image Pull Policy | policy for image-henting | Partly | Policy kept as nb word; pull=henting | Headlamp sv/glossary.json 'Princip för hämtade avbildningar'; convention |
| Image Pull Secrets | hemmeligheter for image-henting | Partly |  | derived from Secret + Image |

### Workload kinds

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Deployment | Deployment (deploymentet, deployments) | Yes | Keep the kind. Use 'utrulling' for the act of deploying, never 'distribusjon' (collides with Linux distribution) or 'distribuering' | [Kartverket SKIP](https://skip.kartverket.no/docs/) 'deployment' 74x as kind + 'utrulling' 99x for the act (section 'Applikasjon-utrulling'); [Folq](https://www.folq.no/kubernetes/) 'deployments'; contra [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'distribusjon', [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'Distribuering' |
| Deployments | Deployments | Yes | Nav/list heading | [Kartverket SKIP](https://skip.kartverket.no/docs/); Headlamp de/glossary.json keeps Deployments |
| ReplicaSet | ReplicaSet (pl. ReplicaSets) | Yes | Keep kind; sv 'Replikuppsättningar' is unidiomatic | [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) 'Distribusjoner bruker dessuten ReplicaSets'; Headlamp de/glossary.json Replika-Sets |
| StatefulSet | StatefulSet (pl. StatefulSets) | Yes | Keep kind; sv 'Tillståndskänsliga uppsättningar' is unidiomatic | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator/api-docs) 'StatefulSet'; Headlamp de/glossary.json Stateful Sets |
| DaemonSet | DaemonSet (pl. DaemonSets) | Yes | Keep kind | Headlamp de/glossary.json Daemon-Sets; convention with ReplicaSet/StatefulSet |
| Job | jobb (jobben, jobber, jobbene) |  | General word; Kubernetes Job is translated in GitLab's Kubernetes dashboard | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Jobs'=>'Jobber'; [Kartverket SKIP](https://skip.kartverket.no/docs/) 'jobben'; Headlamp sv/glossary.json Jobb |
| CronJob | CronJob (cronjobben, CronJobs) | Yes | Keep kind; en 'Cron Jobs' key should become 'CronJobs' | [Kartverket SKIP](https://skip.kartverket.no/docs/) 'CronJob', 'suspenderer cronjobben'; Headlamp sv/glossary.json Cron-jobb |
| JobSet / LeaderWorkerSet | JobSet / LeaderWorkerSet | Yes | CRD kinds | convention |

### Services and networking

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Service | tjeneste (tjenesten, tjenester, tjenestene) |  | Translate per nb localizations. SKIP mixes 'service' (kind) and 'tjeneste'; use 'Service' only when quoting the kind | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Services'=>'Tjenester'; [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) Service=Tjeneste; [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) Services=>Tjenester; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Services=>Tjenester |
| Service Account | tjenestekonto (tjenestekontoen, tjenestekontoer, tjenestekontoene) |  |  | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator/configuring) 'tjenestekonto (service account)'; [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator) 'tjenestekontoer'; Headlamp sv/glossary.json Tjänstkonto |
| Ingress | ingress (ingressen, ingresser, ingressene) | Yes | Keep as loanword for the resource. In NetworkPolicy rules the same English key means direction: translate that as 'inngående'. Reject Microsoft 'inngang' | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator/configuring) 'ingressene'; [Folq](https://www.folq.no/kubernetes/) 'ingress-kontrollere'; contra [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'inngang' |
| Ingress (NetworkPolicy direction) | inngående |  | Direction label in network policy rules | Headlamp sv/glossary.json Inkommande; convention |
| Egress | utgående |  | Direction label in network policy rules | Headlamp sv/glossary.json Utgående; [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/argokit/argokit-v2) 'utgående trafikk' |
| Ingress Class | ingressklasse (pl. ingressklasser) | Partly |  | Headlamp sv/glossary.json Ingressklass |
| Gateway | gateway (gatewayen, gatewayer, gatewayene) | Yes | Gateway API resource | Headlamp sv/glossary.json Gateways; [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'gateway-API-en' |
| Gateway Class | gateway-klasse (pl. gateway-klasser) | Partly |  | Headlamp sv/glossary.json Gateway-klasser |
| HTTP Routes / GRPC Routes / TCP Routes / UDP Routes | HTTP-ruter / gRPC-ruter / TCP-ruter / UDP-ruter | Partly | rute, ruten, ruter, rutene. Where the UI shows the kind (HTTPRoute, GRPCRoutes keys) keep the kind | Headlamp sv/glossary.json HTTP-vägar; convention |
| Listeners | lyttere |  |  | Headlamp sv/glossary.json Lyssnare; convention |
| Reference Grants | ReferenceGrants | Yes | Gateway API kind; no nb term | convention |
| Backend | backend (backenden, backender, backendene) | Yes | Contradicts Microsoft 'serverdel'. Norwegian engineers write backend; serverdel is opaque for Ingress/Gateway backends | [Kartverket SKIP](https://skip.kartverket.no/docs/) 'backend' 11x; [Folq](https://www.folq.no/kubernetes/) 'backend-tjenester'; contra [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) [Azure nb-NO](https://azure.microsoft.com/nb-no/products/application-gateway) 'serverdel', Headlamp sv/glossary.json Serverdelar; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Backend=>'Motor' (wrong) |
| Default Backend | standard-backend | Partly |  | derived |
| Backend TLS Policies / Backend Traffic Policies | BackendTLSPolicies / BackendTrafficPolicies | Yes | Gateway API kinds; in prose 'TLS-policyer for backend' | convention |

### Configuration and storage

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| ConfigMap | ConfigMap (pl. ConfigMaps) | Yes | Keep kind; sv 'Konfigurationskartor' is unidiomatic | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/argokit/argokit-v2) 'ConfigMap' (SKIP 62x); Headlamp de/glossary.json Config Maps |
| Secret | hemmelighet (hemmeligheten, hemmeligheter, hemmelighetene) |  | Translate; SKIP uses hemmelighet for the concept and 'Secret' when naming the kind | [Kartverket SKIP](https://skip.kartverket.no/docs/tilgangsstyring/accesserator/klienter-og-hemmeligheter) 'hemmeligheter' (SKIP 145x hemmelighet*); [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) 'hemmeligheter, et annet Kubernetes-objekt'; [Azure nb-NO](https://azure.microsoft.com/nb-no/products/key-vault); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'Copy secret'=>'Kopier hemmelighet'; Headlamp sv/glossary.json Hemligheter |
| Volume | volum (volumet, volumer, volumene) |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) volume=>volum; [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po) Volume=>Volum; [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) |
| Persistent Volume | vedvarende volum (pl. vedvarende volumer) |  | PV acronym may stay | Headlamp sv/glossary.json Beständiga volymer; convention (no nb source found) |
| Persistent Volume Claim | vedvarende volumkrav (pl. same); PVC |  | Claim=krav | Headlamp sv/glossary.json Bestående volymanspråk; convention (no nb source found) |
| Claim | krav |  | Not a verb (sv 'Gör anspråk' is a mistranslation) | convention (no nb source found) |
| Volume Mounts | volummonteringer |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) 'NFS mount'=>'NFS-montering'; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) 'Mount Point'=>'Monteringspunkt' |
| Mount | montering (noun) / monter (verb) |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) Mount=>Montér; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Mount=>Monter |
| Mount Options | monteringsalternativer |  |  | convention (no nb source found) |
| Storage | lagring |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po); [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Storage=>Lagring |
| Storage Class | lagringsklasse (lagringsklassen, lagringsklasser, lagringsklassene) |  |  | Headlamp sv/glossary.json Lagringsklasser; derived from Storage |
| Volume Attributes Class | volumattributtklasse (pl. -klasser) |  |  | convention (no nb source found) |
| Provisioner | klargjører |  | provision=klargjøre | Headlamp sv/glossary.json Etablerare; convention (no nb source found) |
| Reclaim Policy | gjenvinningspolicy |  |  | convention (no nb source found) |
| Access Modes | tilgangsmoduser |  |  | Headlamp sv/glossary.json Åtkomstlägen; convention (no nb source found) |

### Access control and the API

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Role | rolle (rollen, roller, rollene) |  |  | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Role/Roles=>Rolle/Roller; [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) roles=>roller |
| Role Binding | rollebinding (rollebindingen, rollebindinger, rollebindingene) |  |  | Headlamp sv/glossary.json Rollbindningar; Headlamp de/glossary.json Rollenbindungen |
| ClusterRole / ClusterRoleBinding | klyngerolle / klyngerollebinding |  | Follows Cluster=klynge; SKIP keeps 'clusterrole' | derived |
| Custom Resource | egendefinert ressurs (pl. egendefinerte ressurser) |  | custom=egendefinert (Microsoft nb convention) | Headlamp sv/glossary.json Anpassade resurser; convention (no nb source found) |
| Custom Resource Definition (CRD) | definisjon av egendefinert ressurs (CRD) | Partly | Keep acronym CRD in headings ('CRD: `{{ crdName }}`') | convention (no nb source found) |
| Resource | ressurs (ressursen, ressurser, ressursene) |  |  | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Resources=>Ressurser |
| Kind | Kind | Yes | API field; 'type' would collide with Service type / Strategy Type | Headlamp sv/glossary.json Typ; Headlamp de/glossary.json Art; convention |
| Endpoint | endepunkt (endepunktet, endepunkter, endepunktene) |  |  | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'stabilt endepunkt'; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'endepunkts konfigurasjon' |
| Endpoint Slices | EndpointSlices | Yes | No settled nb term | Headlamp sv/glossary.json Slutpunktsutsnitt; convention |
| Event | hendelse (hendelsen, hendelser, hendelsene) |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Events'=>'Hendelser'; [Kartverket SKIP](https://skip.kartverket.no/docs/) hendelser; Headlamp sv/glossary.json Händelser |

### Health, scheduling and policy

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Probe | probe (proben, prober, probene) | Yes | Norwegian engineers keep probe. Reject 'sonde' (medical) and 'sjekk' as the term; use 'helsesjekk' only in prose for the general idea | [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/helsesjekker-i-kubernetes) 'Startup probe', heading 'Helsesjekker i Kubernetes'; Headlamp sv/glossary.json avsökningar; Headlamp de/glossary.json Prüfungen |
| Liveness / Readiness / Startup Probes | liveness-prober / readiness-prober / startup-prober | Yes | Keep the qualifiers as Kubernetes names | [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/helsesjekker-i-kubernetes) |
| Readiness Gates | readiness-gates | Yes | No nb term; sv/de calques read poorly | convention |
| Taint | taint (tainten, taints) | Yes | No nb source; sv 'Spår' is misleading. Keep paired with toleration | Headlamp sv/glossary.json Spår; convention (no nb source found) |
| Toleration | toleration (pl. tolerations) | Yes | Keep paired with taint; alternative 'toleranse(r)' as in sv/de | Headlamp sv/glossary.json Toleranser; Headlamp de/glossary.json Toleranzen; convention (no nb source found) |
| Affinity | affinitet (affiniteten, affiniteter); anti-affinity: antiaffinitet |  |  | [Bokmålsordboka](https://ordbokene.no/nob/bm/affinitet); convention (no nb source found) |
| Session Affinity | øktaffinitet |  | session=økt | convention (no nb source found) |
| Selector | velger (velgeren, velgere, velgerne) |  | SKIP keeps 'selector' for field names | Headlamp sv/glossary.json Väljare; convention (no nb source found) |
| Label | etikett (etiketten, etiketter, etikettene) |  |  | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator/configuring) 'merkelapp (label)', SKIP 'etiketter'; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Label=>Etikett; Headlamp sv/glossary.json Etiketter |
| Annotation | annotasjon (annotasjonen, annotasjoner, annotasjonene) |  | Avoid 'merknad' (= remark/comment) | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/reloader) 'annotasjonen'; contra [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Annotations'=>'Merknader' |
| Replica | replika (replikaen, replikaer, replikaene) |  |  | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'replikaer'; [Kartverket SKIP](https://skip.kartverket.no/docs/) 'replikaer' |
| Workload | arbeidsbelastning (-en, -er, -ene) |  | Microsoft/Cockpit term; SKIP keeps 'workload(s)' 75x. Shorter alt 'arbeidslast(er)' (older Microsoft page) | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'arbeidsbelastninger'; [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); contra [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/retningslinjer-for-kubernetes) 'workloads' |
| Controller | kontroller (kontrolleren, kontrollere, kontrollerne) |  | Beware clash with imperative 'kontroller' on buttons | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'Kjører kontrollere' |
| Policy | policy (policyen, policyer, policyene) |  | Reject 'retningslinje' (GitLab) for technical policies; keep that for guidelines | [Bokmålsordboka](https://ordbokene.no/nob/bm/policy); [Azure nb-NO](https://azure.microsoft.com/nb-no/products/key-vault) 'policyer'; [Kartverket SKIP](https://skip.kartverket.no/docs/) 'policyer'; [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) 'SELinux-policy'; contra [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Policies=>Retningslinjer |
| Network Policy | nettverkspolicy (-en, -er, -ene) |  |  | [Kartverket SKIP](https://skip.kartverket.no/docs/applikasjon-utrulling/skiperator) 'nettverkspolicyer'; Headlamp sv/glossary.json Nätverksprinciper |
| Lease | Lease (pl. Leases) | Yes | Coordination kind; DHCP sense 'leieavtale' does not fit; sv 'Livslängd' is wrong | Headlamp de/glossary.json Lease; convention (no nb source found) |
| Webhook | webhook (pl. webhooks) | Yes |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Webhooks=>Webhooks |
| Mutating / Validating Webhook Configurations | muterende / validerende webhook-konfigurasjoner | Partly |  | Headlamp de/glossary.json Mutierende Webhook-Konfigurationen |
| Priority Class | prioritetsklasse (pl. prioritetsklasser) |  |  | Headlamp sv/glossary.json Prioritetsklasser |
| Runtime Class | kjøretidsklasse (pl. kjøretidsklasser) |  | runtime=kjøretid | Headlamp sv/glossary.json Körningsklasser; convention (no nb source found) |
| Resource Quota | ressurskvote (pl. ressurskvoter) |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'Usage quotas'=>'Brukskvoter'; Headlamp sv/glossary.json Resurskvoter |
| Limit Range | LimitRange (pl. LimitRanges) | Yes | No settled nb term | Headlamp de/glossary.json Limit Ranges; Headlamp sv/glossary.json Gränsintervall |
| Horizontal Pod Autoscaler (HPA) | horisontal pod-autoskalerer (pl. -autoskalerere); HPA | Partly | Keep acronyms HPA/VPA in short labels | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'skalering'; Headlamp sv/glossary.json Horisontella poddautoskalningar |
| Vertical Pod Autoscaler (VPA) | vertikal pod-autoskalerer (pl. -autoskalerere); VPA | Partly |  | Headlamp sv/glossary.json Vertikala poddautoskalningar |
| Pod Disruption Budget (PDB) | avbruddsbudsjett for podder (pl. avbruddsbudsjetter); PDB | Partly |  | Headlamp sv/glossary.json 'Störningsbudget för podd'; convention (no nb source found) |

### Cluster access and status

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Port Forwarding / Port forward | portvideresending (-en, -er, -ene) |  | Start/Stop port forward = Start/Stopp portvideresending | [RustDesk nb](https://github.com/rustdesk/rustdesk/blob/master/src/lang/nb.rs) 'portvideresending'; [Motrix nb](https://github.com/agalwood/Motrix/blob/master/src/shared/locales/nb.json) 'Portvideresending (NAT)' |
| kubeconfig | kubeconfig (kubeconfig-filen) | Yes | File/tool name | [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/logge-inn-p%C3%A5-cluster) 'Generer kubeconfig og sett som aktiv context' |
| Context (kubeconfig) | kontekst (konteksten, kontekster, kontekstene) |  | Contradicts SKIP, which keeps 'context'. kontekst is an exact cognate engineers recognize | contra [Kartverket SKIP](https://skip.kartverket.no/docs/kom-i-gang/praktisk-intro/kubernetes/logge-inn-p%C3%A5-cluster) 'context'; convention |
| Scheduling | planlegging |  | scheduler=planlegger | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'Planleggeren ser etter podder' |
| QoS Class | QoS-klasse | Partly |  | convention (no nb source found) |
| Rolling update | rullende oppdatering |  |  | [Azure nb-NO](https://azure.microsoft.com/nb-no/solutions/kubernetes-on-azure/get-started/) 'rullende oppdateringer' |
| Update Strategy | oppdateringsstrategi |  |  | Headlamp sv/glossary.json Uppdateringsstrategi |
| Desired / Current / Ready | ønsket / gjeldende / klar |  |  | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'ønsket tilstand'; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Ready'=>'Klar' |
| Restarts (count) | omstarter |  | Noun; the action button is 'Start på nytt' | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) Restart=>Omstart; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Restart=>Omstart |
| Condition(s) | betingelse (pl. betingelser) |  | Status conditions | Headlamp sv/glossary.json Villkor; convention (no nb source found) |
| Requests / Limits | forespørsler / grenser |  | CPU-forespørsler, minnegrenser | Headlamp sv/glossary.json Förfrågan/Gräns; convention (no nb source found) |
| Capacity / Allocatable | kapasitet / allokerbar |  |  | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Capacity=>Kapasitet |
| Owner | eier |  |  | Headlamp sv/glossary.json Ägare |
| Environment | miljø |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Environment=>Miljø |

### UI actions and labels

| English | Norwegian | In English | Note | Evidence |
| --- | --- | --- | --- | --- |
| Settings | Innstillinger |  |  | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Settings=>Innstillinger; contra [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'Alternativer' |
| Apply | Bruk |  |  | [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po) Apply=>Bruk; [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Apply=>Bruk |
| Cancel | Avbryt |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Cancel=>Avbryt |
| Delete | Slett |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Delete=>Slett |
| Edit | Rediger |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Edit=>Rediger |
| Restart (action) | Start på nytt |  | Cockpit/Proxmox use 'Omstart' as a button; prefer the verb phrase | [KDE Plasma nb](https://github.com/KDE/plasma-desktop/tree/master/po/nb) 'Start på nytt'; contra [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) 'Omstart' |
| Scale | Skaler |  | Scale Replicas = Skaler replikaer | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'skaler', 'skalering' |
| Logs | Logger |  | Show Logs = Vis logger | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) Logs=>Logger; [Kartverket SKIP](https://skip.kartverket.no/docs/observability/logs-with-Loki) 'logger' |
| Terminal | Terminal |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) Terminal=>Terminal |
| Terminal / Exec | Terminal / exec | Partly | exec is the kubectl verb | convention |
| Shell | skall |  | Shell: `{{ itemName }}` = Skall: `{{ itemName }}` | [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Shell=>Skall |
| Attach | Koble til |  | Attach to a running container; sv 'Bifoga' (attach a file) is the wrong sense | convention (no nb source found) |
| Drain | Tøm |  | Drain Node = Tøm node; kubectl verb may be shown in a tooltip | Headlamp de/glossary.json Entleeren; Headlamp sv/glossary.json Rensa; convention (no nb source found) |
| Cordon | Sperr for planlegging |  | Short form 'Sperr' | Headlamp de/glossary.json 'Planungssperre setzen'; Headlamp sv/glossary.json Blockera; convention (no nb source found) |
| Uncordon | Opphev sperring |  |  | Headlamp de/glossary.json 'Planungssperre aufheben'; Headlamp sv/glossary.json Avblockera; convention (no nb source found) |
| Plugins | programtillegg (programtillegget, programtillegg, programtilleggene) |  | Cockpit used 'utvidelse' | [Picard nb](https://github.com/metabrainz/picard/blob/master/po/nb.po); [WinMerge](https://github.com/WinMerge/winmerge/blob/master/Translations/WinMerge/Norwegian.po) Plugins=>Programtillegg; contra [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po) plugin=>utvidelse |
| Home | Hjem |  |  | convention (no nb source found) |
| Notifications | Varsler |  | Alt 'Varslinger' | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Notifications=>Varsler; [Joplin nb_NO](https://github.com/laurent22/joplin/blob/dev/packages/tools/locales/nb_NO.po) Varsler |
| Search | Søk |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po); [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) Search=>Søk |
| Overview | Oversikt |  |  | [Cockpit nb_NO](https://github.com/cockpit-project/cockpit/blob/ae346097fff6adc6816eeb5a5af88e639a6156f5/po/nb_NO.po); [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po) Overview=>Oversikt |
| Filter | Filtrer (verb) / filter (noun) |  |  | convention (no nb source found) |
| Save / Close / Create / Add / Remove | Lagre / Lukk / Opprett / Legg til / Fjern |  |  | [Cockpit Machines nb_NO](https://github.com/cockpit-project/cockpit-machines/blob/acd4b022a8bd76110e09cbd8ff313a9445e72b13/po/nb_NO.po) 'Create storage pool'=>'Opprett lagrings-pool'; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Remove=>Fjern |
| Refresh / Copy / Download | Oppdater / Kopier / Last ned |  |  | convention (no nb source found) |
| Suspend / Resume | Stans midlertidig / Gjenoppta |  | sv 'Inaktivera' is weaker | convention (no nb source found) |
| Rollback | Rull tilbake |  | noun: tilbakerulling | [Azure nb-NO](https://azure.microsoft.com/nb-no/resources/cloud-computing-dictionary/what-is-kubernetes/) 'utrulling og tilbakerulling' |
| Debug Node | Feilsøk node |  |  | convention (no nb source found) |
| Labels / Annotations (UI headings) | Etiketter / Annotasjoner |  | See Label/Annotation rows | [Kartverket SKIP](https://skip.kartverket.no/docs/) |
| Status / Age / Name | Status / Alder / Navn |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'KubernetesDashboard\|Status'=>'Status', 'KubernetesDashboard\|Name'=>'Navn' |
| Map | Kart |  | Resource map view | Headlamp sv/glossary.json Karta |
| Security / Configuration / Network | Sikkerhet / Konfigurasjon / Nettverk |  |  | [GitLab nb_NO](https://gitlab.com/gitlab-org/gitlab/-/raw/master/locale/nb_NO/gitlab.po) 'ClusterAgents\|Security'=>'Sikkerhet'; [Proxmox nb](https://git.proxmox.com/?p=proxmox-i18n.git;a=blob_plain;f=nb.po) Network=>Nettverk |
