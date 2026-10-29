---
title: MLOps Interview Questions for DevOps and Platform Engineers
description: MLOps interview questions for experienced DevOps engineers: how ML pipelines differ from app CI/CD, model registries, feature stores, drift and release gates.
date: 2026-10-29
keywords: mlops interview questions, mlops interview questions and answers for experienced, mlops scenario based interview questions, ml pipeline interview questions, model deployment interview questions, model drift interview questions
topic_id: A01
---

MLOps interview questions for DevOps and platform engineers usually start from what you already know. You have built CI/CD pipelines, so the interviewer asks how an ML pipeline is different, then keeps pushing until the answer stops sounding like application delivery with a GPU attached. The questions below follow that path, from the pipeline itself through registries, feature stores and drift to gating a model release.

## MLOps interview questions on ML pipelines vs app CI/CD

### 1. What changes when the artifact is a model instead of a binary?

Three things. The artifact is the product of code, data and configuration together, so the same commit trained on a newer data snapshot gives a different model. The tests are statistical: a model gets a score, and someone has to decide which score is good enough. And a model can get worse in production while nothing about it changes, because the world moves away from the data it learned from.

Google's [MLOps architecture guide](https://docs.cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning) spells out the consequences: CI also tests and validates data, data schemas and models; CD ships a training pipeline that deploys another service; and continuous training (CT), retraining and serving models automatically, is unique to ML systems.

| | App CI/CD | ML pipeline |
|---|---|---|
| What gets versioned | Code and dependencies | Code, data snapshot, config, hyperparameters |
| What starts a run | A commit | A commit, new data, a schedule or a monitoring alert |
| What the tests check | Behaviour is correct | Data is valid and model scores clear a bar |
| What gets deployed | A service | A model, and often the pipeline that retrains it |
| How it fails in production | Errors and latency | Errors and latency, plus quiet accuracy loss |

The free [MLOps vs DevOps question](/questions/mlops-vs-devops-what-s-different) is the short version of this answer.

### 2. What does reproducible training actually require?

Being able to rebuild a model from its record. That means pinning the code commit, an immutable data snapshot (a DVC-tracked file, a lakeFS commit, a Delta Lake or Iceberg table version), the container image by digest, the hyperparameters and the random seeds. A tracking server such as MLflow logs parameters, metrics and artifacts per run, so the registry entry can point back to the exact run that produced it.

The caveat: bit-for-bit identical weights are often out of reach. The PyTorch docs say completely reproducible results are not guaranteed across releases, individual commits or platforms, so the realistic goal is a rebuilt model that scores within tolerance of the original.

## Training vs serving

### 3. Why do training and serving run as separate systems?

Because they want opposite things. Training is a batch job that wants throughput and large GPUs, and with checkpoints it survives interruption, so it can run on spot capacity. Serving is a latency-bound service that runs all the time, scales with traffic, and often fits on smaller accelerators or CPU.

On Kubernetes, training runs as jobs, often through Kubeflow Trainer or a RayJob, with Kueue in front: it manages quotas and decides when a job waits, is admitted or is preempted. Its timeout-based all-or-nothing mode evicts and requeues a distributed job whose pods don't all start, instead of letting it sit on half the GPUs it asked for. Serving runs as Deployments or a KServe InferenceService behind an autoscaler. Share one node pool without quotas and a large training job can starve serving. GPU scheduling and sharing have their own set of questions on the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions).

### 4. What is training-serving skew, and how do you prevent it?

Skew is the model seeing features at serving time computed differently from the ones it trained on. The classic cause is two implementations: a Spark or SQL job computes "orders in the last 30 days" for training, and the online service recomputes it in application code with a different time zone, window boundary or null handling. Nothing errors. The model just gets worse.

Ways to prevent it, cheapest first:

- Log the exact feature values the service used for each prediction, and train the next model on those logs.
- Define each feature once and serve that definition to both training and inference, which is the job of a feature store.
- Compare each feature's training distribution with what serving sees.

A related trap is leakage through time: a training row for a prediction made on 1 March may only use feature values known on 1 March. Get it wrong and offline scores look better than production ever will.

## Model registry and feature store questions

### 5. What does a model registry give you that an S3 bucket doesn't?

A bucket stores files. A registry stores versions with meaning attached: the run that produced each one, its evaluation results, its input and output signature, who approved it, and which version is live.

In MLflow, an alias is a mutable, named reference to one model version. Serving loads `models:/fraud-scorer@champion` instead of a hard-coded version number. The alias resolves when the model loads, so promotion means moving the alias and then rolling or reloading the servers, and rollback is the same in reverse. MLflow deprecated the older Staging and Production stages in favour of aliases and tags. Whatever registry you use, versions should be immutable: a new model is a new version, never an overwritten file.

### 6. When is a feature store worth it, and when is it overkill?

A feature store has two halves. The offline store holds historical values for building training sets; the online store holds only the latest value per entity for low-latency lookups at serving time. In Feast, `feast materialize` loads values from offline into online, and `get_historical_features` builds a training set with a point-in-time join: each row gets the latest feature value whose event timestamp isn't later than the row's, which keeps future values out. Backfills and corrections can still leak in, because they carry old event timestamps, so reproducing what serving actually knew also needs the time each value was written.

It earns its place when several models share features, when online serving needs the same features training used, and when you have to say which feature definitions a model trained on. It's overkill for a single model scored in batch from one warehouse query: there's no online path to skew against. The free [feature store question](/questions/feature-stores-3-reasons-your-ml-pipeline-needs-one) covers the build-or-buy follow-up.

## Drift detection and retraining questions

### 7. Data drift, concept drift and prediction drift: what's the difference?

- **Data drift** (covariate shift): the distribution of inputs changes. A new customer segment arrives, or an upstream team changes a unit.
- **Concept drift**: the relationship between inputs and the correct answer changes. Fraudsters adapt to your model, so the same transaction pattern now means something else.
- **Prediction drift**: the distribution of the model's outputs changes, which is often the first thing you can see.

Data and prediction drift only need the inputs and outputs you already log. Concept drift needs ground-truth labels, which often arrive late: a chargeback can land weeks after the transaction. NannyML estimates performance before labels arrive, using the model's confidence scores for classifiers, but its docs say those methods don't work under concept drift, the case where you most need labels.

### 8. How do you detect drift without drowning in false alarms?

Compare each feature between a reference window, such as the training data, and a recent window. Kolmogorov-Smirnov for numeric features and chi-squared for categorical ones are the textbook tests. The trap is sample size: with millions of rows, a p-value test flags differences far too small to matter. [Evidently's defaults](https://docs.evidentlyai.com/metrics/explainer_drift) reflect this: when the reference dataset has up to 1,000 observations it uses statistical tests such as K-S and chi-squared, and above that it switches to Wasserstein distance and Jensen-Shannon divergence, with a threshold on the distance instead of a p-value. Beyond the choice of test:

- Weight alerts by feature importance. Drift in a feature the model barely uses rarely matters.
- Alert on drift that persists across several windows, not one noisy hour.
- Check data quality first. A lot of "drift" is a broken pipeline: a column of nulls, a renamed category, a changed unit.

### 9. Should a model retrain on a schedule, on drift, or on performance?

Each has a failure mode. A schedule retrains when nothing changed and waits when something did. A drift trigger reacts to changed inputs, but drift doesn't always hurt accuracy. A performance trigger is the best signal and the slowest, because it waits for labels.

A defensible design keeps a schedule as the baseline, lets drift and performance alerts start the pipeline early, and sends every retrained model through the same release gate. Retraining is not deploying. Watch for models that shape the data they are later trained on. A recommender only collects clicks on what it chose to show, so its training data needs some exploration traffic or a holdout group.

## Gating a model release: scenario-based questions

### 10. How do you gate a model release the way you gate code?

With checks that run in the pipeline and fail closed, roughly in this order:

1. **Data validation before training**: schema, null rates, value ranges and row counts against the previous snapshot. Great Expectations and TensorFlow Data Validation are common tools.
2. **Artifact safety, before anything loads the model**. Pickle-based files can run code when they load, which is why PyTorch 2.6 made `weights_only=True` the default for `torch.load`. Prefer safetensors, and load pickle files from outside the pipeline only in an isolated sandbox: a scanner catches known patterns, not every payload.
3. **Offline evaluation** on a fixed, versioned holdout set, compared with the current production model on the same set.
4. **Slice metrics**. An overall improvement can hide a regression for one region, device type or customer segment.
5. **Serving checks**: the signature matches the serving contract, the artifact loads in the serving image, and latency and memory fit the target hardware.
6. **Human approval** where the model makes decisions with legal or financial weight.

It is the same principle as the gates in a [DevSecOps pipeline built from scratch](/blog/devsecops-pipeline-from-scratch): the pipeline decides, and nobody promotes around it by hand. If both runs log their score on the same versioned holdout set, the comparison step is a short script against the registry:

```python
from mlflow import MlflowClient

client = MlflowClient()
NAME, METRIC = "fraud-scorer", "holdout_auc"
TOLERANCE = 0.002  # agreed with the model owner

def score(alias):
    version = client.get_model_version_by_alias(NAME, alias)
    value = client.get_run(version.run_id).data.metrics.get(METRIC)
    if value is None or not 0.0 <= value <= 1.0:  # also rejects NaN
        raise SystemExit(f"{alias} v{version.version}: no valid {METRIC}")
    return version, value

_, champion_score = score("champion")
challenger, challenger_score = score("challenger")

if challenger_score < champion_score - TOLERANCE:
    raise SystemExit(f"{METRIC} regressed; challenger v{challenger.version} blocked")

client.set_registered_model_alias(NAME, "canary", challenger.version)
```

Passing only moves the canary alias. The deploy step that follows rolls the canary servers onto that version, and it becomes champion after it survives live traffic.

### 11. Shadow, canary or A/B test: which do you use for a new model?

Often all three, in that order, because they answer different questions.

- **Shadow**: copy live requests to the new model and discard its responses. You see its latency, errors and how its predictions differ from the current model's, with no user exposure, but nothing about outcomes. Istio's traffic mirroring works this way: mirrored requests are fire and forget. Make sure the shadow path has no side effects, such as writing decisions to a database.
- **Canary**: send a small share of real traffic to the new model and roll back on errors, latency and whatever quality signal you have. KServe splits the traffic through `canaryTrafficPercent` on an InferenceService ([only in serverless deployment mode](https://kserve.github.io/website/docs/model-serving/predictive-inference/rollout-strategies/canary-example)), but promotion and rollback are changes you apply, so the automatic part has to come from your pipeline or a controller watching the metrics. Without KServe, Argo Rollouts (a Rollout resource with an analysis template, in place of the Deployment or referencing it) or Flagger (a Canary resource that targets the Deployment) handles both the split and the metric-driven rollback.
- **A/B test**: a randomized experiment with enough traffic and time to measure a business metric with statistical confidence. A canary can be run that way too, but a traffic percentage on its own shows the model is safe to run, not that it is better for the business.

The general mechanics are in the free [canary deployment question](/questions/canary-deployments-test-in-production-safely). What's specific to ML is that "healthy" includes prediction quality, which HTTP metrics won't show.

### 12. A new model is live and conversion drops. How do you roll back?

Rollback should be a pointer change: point serving back at the previous version, which is still in the registry and ideally still warm. In KServe's canary flow, setting `canaryTrafficPercent` to 0 sends all traffic back to the previous revision.

Then come the parts that make ML rollback harder than app rollback:

- **Features.** If the new model needed a changed feature definition, the old model needs the old one. Add new features alongside old ones instead of changing them in place.
- **Predictions already written.** Batch scores and stored decisions came from the bad model. Log the model version with every prediction so you can find and recompute them.
- **The retraining loop.** If the bad model's outputs feed the next training set, exclude that window, or the next retrain learns from them.

## How would you run an MLOps platform on Kubernetes?

A reasonable design, layer by layer:

| Layer | Common choice |
|---|---|
| Pipeline orchestration | Kubeflow Pipelines or Argo Workflows |
| Training jobs and GPU quota | Kubeflow Trainer or RayJob, queued through Kueue |
| Experiment tracking and registry | MLflow, with a database and object storage behind it |
| Feature serving | Feast, or a managed feature store |
| Model serving | KServe, or a model server behind a Deployment |
| Drift and quality monitoring | Evidently or NannyML jobs, alerting through the existing stack |

The interviewer cares less about the logos than the boundaries: separate node pools and quotas for training and serving, data scientists submitting work through a pipeline instead of writing manifests, and model promotions recorded like code changes. The Kubernetes basics are in [25 Kubernetes interview questions for 2026](/blog/kubernetes-interview-questions-2026), and sharing one cluster between teams is covered in [designing a multi-tenant Kubernetes cluster](/blog/kubernetes-multi-tenancy-shared-cluster-design).

## Interview questions this covers

- How is an ML pipeline different from a normal CI/CD pipeline?
- What is training-serving skew, and how would you prevent it?
- How do you detect model drift, and when should it trigger retraining?
- How would you gate a model release before it reaches users?
- A new model hurts a business metric after release. How do you roll it back?

For more practice, browse [all the DevOps interview ebooks](/ebooks).

None of the books covers AI infrastructure end to end, but they cover the platform underneath it. [Containers & Orchestration: Kubernetes Interview Questions](/ebooks/container-orchestration-journey) works through 52 senior-level questions with worked answers, including how you would build an MLOps platform on Kubernetes so data scientists can train and serve models without writing YAML. It is one of the five books in the [DevOps Interview Mastery bundle](/ebooks/complete-devops-mastery-bundle), which also includes CI/CD & GitOps and its question on building a pipeline that trains, validates and ships a model and gates a model release the way you gate code. Every purchase includes the free Interview-Day Playbook with a 7-day and 24-hour prep plan and a 30-second answer framework. If a full AI infrastructure book goes ahead, the [AI infrastructure interview questions page](/ai-infrastructure-interview-questions) is where to get the one email about it.
