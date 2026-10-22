import {
  TriggerTracer
} from "./chunk-GJ2HVB4L.mjs";
import {
  ApiError,
  RateLimitError,
  SemanticInternalAttributes,
  TaskRunPromise,
  accessoryAttributes,
  apiClientManager,
  conditionallyExportPacket,
  conditionallyImportPacket,
  createErrorFromCauses,
  createErrorTaskError,
  defaultRetryOptions,
  flattenIdempotencyKey,
  generateFriendlyId,
  getEnvVar,
  getIdempotencyKeyOptions,
  lifecycleHooks,
  makeIdempotencyKey,
  packetRequiresOffloading,
  parsePacket,
  resolveExternalDeploymentId,
  resourceCatalog,
  runtime,
  sdkScope,
  stringifyIO,
  taskContext
} from "./chunk-P6CYADCN.mjs";
import {
  SpanKind,
  init_esm as init_esm2
} from "./chunk-DHADIA3R.mjs";
import {
  __name,
  init_esm
} from "./chunk-244PAGAH.mjs";

// node_modules/@trigger.dev/sdk/dist/esm/v3/config.js
init_esm();
function defineConfig(config) {
  return config;
}
__name(defineConfig, "defineConfig");

// node_modules/@trigger.dev/sdk/dist/esm/v3/tasks.js
init_esm();

// node_modules/@trigger.dev/sdk/dist/esm/v3/shared.js
init_esm();
init_esm2();

// node_modules/@trigger.dev/sdk/dist/esm/v3/externalDeploymentId.js
init_esm();
function scopedEnvVar(name) {
  const scope = sdkScope.getStore();
  if (scope && !scope.inheritContext)
    return void 0;
  return getEnvVar(name);
}
__name(scopedEnvVar, "scopedEnvVar");
function resolveTriggerExternalDeploymentId(explicit) {
  if (explicit === null)
    return void 0;
  return resolveExternalDeploymentId({
    explicit,
    clientConfig: apiClientManager.externalDeploymentId,
    read: scopedEnvVar
  });
}
__name(resolveTriggerExternalDeploymentId, "resolveTriggerExternalDeploymentId");

// node_modules/@trigger.dev/sdk/dist/esm/v3/tracer.js
init_esm();

// node_modules/@trigger.dev/sdk/dist/esm/version.js
init_esm();
var VERSION = "4.7.6";

// node_modules/@trigger.dev/sdk/dist/esm/v3/tracer.js
var tracer = new TriggerTracer({ name: "@trigger.dev/sdk", version: VERSION });

// node_modules/@trigger.dev/sdk/dist/esm/v3/concurrency-shared.js
init_esm();
function triggerConcurrencyBody(concurrency) {
  if (concurrency === void 0) {
    return {};
  }
  const limits = Array.isArray(concurrency) ? concurrency : [concurrency];
  if (limits.length > 2) {
    throw new Error("The concurrency option accepts at most two named limits.");
  }
  if (limits.some((name) => typeof name !== "string" || name.length === 0)) {
    throw new Error("The concurrency option takes limit names: non-empty strings.");
  }
  for (const name of limits) {
    validateConcurrencyLimitName(name);
  }
  return { concurrency: limits };
}
__name(triggerConcurrencyBody, "triggerConcurrencyBody");
function validateConcurrencyLimitName(name) {
  if (!/^[a-zA-Z0-9_-]{1,122}$/.test(name)) {
    throw new Error(`Concurrency limit "${name}": names are 1-122 characters using only letters, numbers, underscores and hyphens.`);
  }
}
__name(validateConcurrencyLimitName, "validateConcurrencyLimitName");

// node_modules/@trigger.dev/sdk/dist/esm/v3/shared.js
function normalizeTaskQueue(queue) {
  if (!queue) {
    return {};
  }
  return { queue: typeof queue === "string" ? { name: queue } : queue };
}
__name(normalizeTaskQueue, "normalizeTaskQueue");
function normalizeTaskConcurrency(taskId, concurrency) {
  if (!concurrency) {
    return void 0;
  }
  const items = Array.isArray(concurrency) ? concurrency : [concurrency];
  const inline = [];
  const limits = [];
  for (const item of items) {
    if (typeof item === "string") {
      limits.push(item);
    } else if (item && typeof item === "object" && "name" in item && typeof item.name === "string") {
      validateConcurrencyLimitName(item.name);
      resourceCatalog.registerConcurrencyLimitMetadata(item);
      limits.push(item.name);
    } else if (item && typeof item === "object") {
      inline.push({ perKey: item.perKey, total: item.total });
    }
  }
  if (inline.length > 1) {
    throw new Error(`Task "${taskId}": concurrency accepts at most one inline limit. Give shared limits a name with concurrencyLimit().`);
  }
  if (limits.length > 2) {
    throw new Error(`Task "${taskId}": concurrency accepts at most two named limits.`);
  }
  return {
    inline: inline[0],
    limits: limits.length > 0 ? limits : void 0
  };
}
__name(normalizeTaskConcurrency, "normalizeTaskConcurrency");
function triggerQueueBody(queue, fallbackQueueName) {
  const name = queue ?? fallbackQueueName;
  return { queue: name ? { name } : void 0 };
}
__name(triggerQueueBody, "triggerQueueBody");
function createTask(params) {
  const normalizedQueue = normalizeTaskQueue(params.queue);
  const task2 = {
    id: params.id,
    description: params.description,
    jsonSchema: params.jsonSchema,
    trigger: /* @__PURE__ */ __name(async (payload, options) => {
      return await trigger_internal("trigger()", params.id, payload, void 0, {
        queue: normalizedQueue.queue?.name,
        ...options
      });
    }, "trigger"),
    batchTrigger: /* @__PURE__ */ __name(async (items, options) => {
      return await batchTrigger_internal("batchTrigger()", params.id, items, options, void 0, void 0, normalizedQueue.queue?.name);
    }, "batchTrigger"),
    triggerAndWait: /* @__PURE__ */ __name((payload, options, requestOptions) => {
      return new TaskRunPromise((resolve, reject) => {
        triggerAndWait_internal("triggerAndWait()", params.id, payload, void 0, {
          queue: normalizedQueue.queue?.name,
          ...options
        }, requestOptions).then((result) => {
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      }, params.id);
    }, "triggerAndWait"),
    triggerAndSubscribe: /* @__PURE__ */ __name((payload, options) => {
      return new TaskRunPromise((resolve, reject) => {
        triggerAndSubscribe_internal("triggerAndSubscribe()", params.id, payload, void 0, {
          queue: normalizedQueue.queue?.name,
          ...options
        }).then((result) => {
          resolve(result);
        }).catch((error) => {
          reject(error);
        });
      }, params.id);
    }, "triggerAndSubscribe"),
    batchTriggerAndWait: /* @__PURE__ */ __name(async (items, options) => {
      return await batchTriggerAndWait_internal("batchTriggerAndWait()", params.id, items, void 0, options, void 0, normalizedQueue.queue?.name);
    }, "batchTriggerAndWait")
  };
  registerTaskLifecycleHooks(params.id, params);
  resourceCatalog.registerTaskMetadata({
    id: params.id,
    description: params.description,
    queue: normalizedQueue.queue,
    concurrency: normalizeTaskConcurrency(params.id, params.concurrency),
    retry: params.retry ? { ...defaultRetryOptions, ...params.retry } : void 0,
    machine: typeof params.machine === "string" ? { preset: params.machine } : params.machine,
    triggerSource: params.triggerSource,
    agentConfig: params.agentConfig,
    maxDuration: params.maxDuration,
    ttl: params.ttl,
    payloadSchema: params.jsonSchema,
    fns: {
      run: params.run
    }
  });
  const queue = normalizedQueue.queue;
  const homeIsReference = typeof params.queue === "string";
  if (queue && typeof queue.name === "string" && !homeIsReference) {
    resourceCatalog.registerQueueMetadata({
      name: queue.name,
      concurrencyLimit: queue.concurrencyLimit
    });
  }
  task2[Symbol.for("trigger.dev/task")] = true;
  return task2;
}
__name(createTask, "createTask");
function uniqueBatchTaskIdentifiers(items) {
  return Array.from(new Set(items.map((item) => item.task))).sort();
}
__name(uniqueBatchTaskIdentifiers, "uniqueBatchTaskIdentifiers");
async function executeBatchTwoPhase(apiClient, items, options, requestOptions) {
  try {
    items = await offloadBatchItemPayloads(items, apiClient);
  } catch (error) {
    throw new BatchTriggerError(`Failed to offload payloads for batch with ${items.length} items`, {
      cause: error,
      phase: "offload",
      itemCount: items.length
    });
  }
  let batch;
  try {
    batch = await apiClient.createBatch({
      runCount: items.length,
      taskIdentifiers: uniqueBatchTaskIdentifiers(items),
      parentRunId: options.parentRunId,
      resumeParentOnCompletion: options.resumeParentOnCompletion,
      idempotencyKey: options.idempotencyKey,
      idempotencyKeyOptions: options.idempotencyKeyOptions
    }, { spanParentAsLink: options.spanParentAsLink }, requestOptions);
  } catch (error) {
    throw new BatchTriggerError(`Failed to create batch with ${items.length} items`, {
      cause: error,
      phase: "create",
      itemCount: items.length
    });
  }
  if (!batch.isCached) {
    try {
      await apiClient.streamBatchItems(batch.id, items, requestOptions);
    } catch (error) {
      throw new BatchTriggerError(`Failed to stream items for batch ${batch.id} (${items.length} items)`, { cause: error, phase: "stream", batchId: batch.id, itemCount: items.length });
    }
  }
  return {
    id: batch.id,
    runCount: batch.runCount,
    publicAccessToken: batch.publicAccessToken,
    taskIdentifiers: items.map((item) => item.task)
  };
}
__name(executeBatchTwoPhase, "executeBatchTwoPhase");
async function offloadBatchItemPayloads(items, apiClient, concurrency = 10) {
  if (items.length === 0) {
    return items;
  }
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await offloadBatchItemPayload(items[index], apiClient);
    }
  }
  __name(worker, "worker");
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}
__name(offloadBatchItemPayloads, "offloadBatchItemPayloads");
async function offloadBatchItemPayload(item, apiClient) {
  if (typeof item.payload !== "string" || item.payload.length === 0) {
    return item;
  }
  const dataType = item.options?.payloadType ?? "application/json";
  if (dataType === "application/store") {
    return item;
  }
  const packet = { data: item.payload, dataType };
  const { size: payloadSize } = packetRequiresOffloading(packet);
  const exported = await conditionallyExportPacket(packet, createTriggerPayloadPathPrefix(), void 0, apiClient);
  return {
    ...item,
    payload: exported.data,
    options: {
      ...item.options,
      payloadType: exported.dataType,
      payloadSize
    }
  };
}
__name(offloadBatchItemPayload, "offloadBatchItemPayload");
var BatchTriggerError = class extends Error {
  static {
    __name(this, "BatchTriggerError");
  }
  phase;
  batchId;
  itemCount;
  /** True if the error was caused by rate limiting (HTTP 429) */
  isRateLimited;
  /** Milliseconds until the rate limit resets. Only set when `isRateLimited` is true. */
  retryAfterMs;
  /** The underlying API error, if the cause was an ApiError */
  apiError;
  /** The underlying cause of the error */
  cause;
  constructor(message, options) {
    const fullMessage = buildBatchErrorMessage(message, options.cause);
    super(fullMessage, { cause: options.cause });
    this.name = "BatchTriggerError";
    this.cause = options.cause;
    this.phase = options.phase;
    this.batchId = options.batchId;
    this.itemCount = options.itemCount;
    if (options.cause instanceof RateLimitError) {
      this.isRateLimited = true;
      this.retryAfterMs = options.cause.millisecondsUntilReset;
      this.apiError = options.cause;
    } else if (options.cause instanceof ApiError) {
      this.isRateLimited = options.cause.status === 429;
      this.apiError = options.cause;
    } else {
      this.isRateLimited = false;
    }
  }
};
function buildBatchErrorMessage(baseMessage, cause) {
  if (!cause) {
    return baseMessage;
  }
  if (cause instanceof RateLimitError) {
    const retryMs = cause.millisecondsUntilReset;
    if (retryMs !== void 0) {
      const retrySeconds = Math.ceil(retryMs / 1e3);
      return `${baseMessage}: Rate limit exceeded - retry after ${retrySeconds}s`;
    }
    return `${baseMessage}: Rate limit exceeded`;
  }
  if (cause instanceof ApiError) {
    return `${baseMessage}: ${cause.message}`;
  }
  if (cause instanceof Error) {
    return `${baseMessage}: ${cause.message}`;
  }
  return baseMessage;
}
__name(buildBatchErrorMessage, "buildBatchErrorMessage");
async function executeBatchTwoPhaseStreaming(apiClient, items, options, requestOptions) {
  const itemsArray = [];
  for await (const item of items) {
    itemsArray.push(item);
  }
  return executeBatchTwoPhase(apiClient, itemsArray, options, requestOptions);
}
__name(executeBatchTwoPhaseStreaming, "executeBatchTwoPhaseStreaming");
function isReadableStream(value) {
  return value != null && typeof value === "object" && "getReader" in value && typeof value.getReader === "function";
}
__name(isReadableStream, "isReadableStream");
async function* readableStreamToAsyncIterable(stream) {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      yield value;
    }
  } finally {
    try {
      await reader.cancel();
    } catch {
    }
    reader.releaseLock();
  }
}
__name(readableStreamToAsyncIterable, "readableStreamToAsyncIterable");
function normalizeToAsyncIterable(input) {
  if (isReadableStream(input)) {
    return readableStreamToAsyncIterable(input);
  }
  return input;
}
__name(normalizeToAsyncIterable, "normalizeToAsyncIterable");
async function* transformSingleTaskBatchItemsStream(taskIdentifier, items, parsePayload, options, queue) {
  let index = 0;
  for await (const item of items) {
    const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
    const payloadPacket = await stringifyIO(parsedPayload);
    const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
    yield {
      index: index++,
      task: taskIdentifier,
      payload: payloadPacket.data,
      options: {
        ...triggerQueueBody(item.options?.queue, queue),
        ...triggerConcurrencyBody(item.options?.concurrency),
        concurrencyKey: item.options?.concurrencyKey,
        test: taskContext.ctx?.run.isTest,
        payloadType: payloadPacket.dataType,
        delay: item.options?.delay,
        ttl: item.options?.ttl,
        tags: item.options?.tags,
        maxAttempts: item.options?.maxAttempts,
        metadata: item.options?.metadata,
        maxDuration: item.options?.maxDuration,
        idempotencyKey: await makeIdempotencyKey(item.options?.idempotencyKey) ?? batchItemIdempotencyKey,
        idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
        machine: item.options?.machine,
        priority: item.options?.priority,
        region: item.options?.region,
        lockToVersion: item.options?.version ?? scopedEnvVar("TRIGGER_VERSION"),
        externalDeploymentId: resolveTriggerExternalDeploymentId(item.options?.externalDeploymentId),
        debounce: item.options?.debounce
      }
    };
  }
}
__name(transformSingleTaskBatchItemsStream, "transformSingleTaskBatchItemsStream");
async function* transformSingleTaskBatchItemsStreamForWait(taskIdentifier, items, parsePayload, options, queue) {
  let index = 0;
  for await (const item of items) {
    const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
    const payloadPacket = await stringifyIO(parsedPayload);
    const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
    const itemIdempotencyKey = await makeIdempotencyKey(item.options?.idempotencyKey);
    const finalIdempotencyKey = itemIdempotencyKey ?? batchItemIdempotencyKey;
    const idempotencyKeyOptions = itemIdempotencyKey ? getIdempotencyKeyOptions(itemIdempotencyKey) : void 0;
    yield {
      index: index++,
      task: taskIdentifier,
      payload: payloadPacket.data,
      options: {
        lockToVersion: taskContext.worker?.version,
        ...triggerQueueBody(item.options?.queue, queue),
        ...triggerConcurrencyBody(item.options?.concurrency),
        concurrencyKey: item.options?.concurrencyKey,
        test: taskContext.ctx?.run.isTest,
        payloadType: payloadPacket.dataType,
        delay: item.options?.delay,
        ttl: item.options?.ttl,
        tags: item.options?.tags,
        maxAttempts: item.options?.maxAttempts,
        metadata: item.options?.metadata,
        maxDuration: item.options?.maxDuration,
        idempotencyKey: finalIdempotencyKey?.toString(),
        idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
        idempotencyKeyOptions,
        machine: item.options?.machine,
        priority: item.options?.priority,
        region: item.options?.region,
        debounce: item.options?.debounce
      }
    };
  }
}
__name(transformSingleTaskBatchItemsStreamForWait, "transformSingleTaskBatchItemsStreamForWait");
async function trigger_internal(name, id, payload, parsePayload, options, requestOptions) {
  const apiClient = apiClientManager.clientOrThrow(requestOptions?.clientConfig);
  const parsedPayload = parsePayload ? await parsePayload(payload) : payload;
  const { packet: triggerPayloadPacket, payloadSize } = await prepareTriggerPayload(parsedPayload, apiClient);
  const processedIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
  const idempotencyKeyOptions = processedIdempotencyKey ? getIdempotencyKeyOptions(processedIdempotencyKey) : void 0;
  const handle = await apiClient.triggerTask(id, {
    payload: triggerPayloadPacket.data,
    options: {
      ...triggerQueueBody(options?.queue),
      ...triggerConcurrencyBody(options?.concurrency),
      concurrencyKey: options?.concurrencyKey,
      test: taskContext.ctx?.run.isTest,
      payloadType: triggerPayloadPacket.dataType,
      payloadSize,
      idempotencyKey: processedIdempotencyKey?.toString(),
      idempotencyKeyTTL: options?.idempotencyKeyTTL,
      idempotencyKeyOptions,
      delay: options?.delay,
      ttl: options?.ttl,
      tags: options?.tags,
      maxAttempts: options?.maxAttempts,
      metadata: options?.metadata,
      maxDuration: options?.maxDuration,
      parentRunId: taskContext.ctx?.run.id,
      machine: options?.machine,
      priority: options?.priority,
      region: options?.region,
      lockToVersion: options?.version ?? scopedEnvVar("TRIGGER_VERSION"),
      externalDeploymentId: resolveTriggerExternalDeploymentId(options?.externalDeploymentId),
      debounce: options?.debounce
    }
  }, {
    spanParentAsLink: true
  }, {
    name,
    tracer,
    icon: "trigger",
    onResponseBody: /* @__PURE__ */ __name((body, span) => {
      if (body && typeof body === "object" && !Array.isArray(body)) {
        if ("id" in body && typeof body.id === "string") {
          span.setAttribute("runId", body.id);
        }
      }
    }, "onResponseBody"),
    ...requestOptions
  });
  return handle;
}
__name(trigger_internal, "trigger_internal");
async function batchTrigger_internal(name, taskIdentifier, items, options, parsePayload, requestOptions, queue) {
  const apiClient = apiClientManager.clientOrThrow(requestOptions?.clientConfig);
  const ctx = taskContext.ctx;
  if (Array.isArray(items)) {
    const ndJsonItems = await Promise.all(items.map(async (item, index) => {
      const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
      const payloadPacket = await stringifyIO(parsedPayload);
      const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
      const itemIdempotencyKey = await makeIdempotencyKey(item.options?.idempotencyKey);
      const finalIdempotencyKey = itemIdempotencyKey ?? batchItemIdempotencyKey;
      const idempotencyKeyOptions = itemIdempotencyKey ? getIdempotencyKeyOptions(itemIdempotencyKey) : void 0;
      return {
        index,
        task: taskIdentifier,
        payload: payloadPacket.data,
        options: {
          ...triggerQueueBody(item.options?.queue, queue),
          ...triggerConcurrencyBody(item.options?.concurrency),
          concurrencyKey: item.options?.concurrencyKey,
          test: taskContext.ctx?.run.isTest,
          payloadType: payloadPacket.dataType,
          delay: item.options?.delay,
          ttl: item.options?.ttl,
          tags: item.options?.tags,
          maxAttempts: item.options?.maxAttempts,
          metadata: item.options?.metadata,
          maxDuration: item.options?.maxDuration,
          idempotencyKey: finalIdempotencyKey?.toString(),
          idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
          idempotencyKeyOptions,
          machine: item.options?.machine,
          priority: item.options?.priority,
          region: item.options?.region,
          lockToVersion: item.options?.version ?? scopedEnvVar("TRIGGER_VERSION"),
          externalDeploymentId: resolveTriggerExternalDeploymentId(item.options?.externalDeploymentId),
          debounce: item.options?.debounce
        }
      };
    }));
    const batchIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
    const batchIdempotencyKeyOptions = batchIdempotencyKey ? getIdempotencyKeyOptions(batchIdempotencyKey) : void 0;
    const response = await tracer.startActiveSpan(name, async (span) => {
      const result = await executeBatchTwoPhase(apiClient, ndJsonItems, {
        parentRunId: ctx?.run.id,
        idempotencyKey: batchIdempotencyKey?.toString(),
        idempotencyKeyOptions: batchIdempotencyKeyOptions,
        spanParentAsLink: true
        // Fire-and-forget: child runs get separate trace IDs
      }, requestOptions);
      span.setAttribute("batchId", result.id);
      span.setAttribute("runCount", result.runCount);
      return result;
    }, {
      kind: SpanKind.PRODUCER,
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "trigger",
        ...accessoryAttributes({
          items: [
            {
              text: taskIdentifier,
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
    const handle = {
      batchId: response.id,
      runCount: response.runCount,
      publicAccessToken: response.publicAccessToken
    };
    return handle;
  } else {
    const asyncItems = normalizeToAsyncIterable(items);
    const transformedItems = transformSingleTaskBatchItemsStream(taskIdentifier, asyncItems, parsePayload, options, queue);
    const streamBatchIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
    const streamBatchIdempotencyKeyOptions = streamBatchIdempotencyKey ? getIdempotencyKeyOptions(streamBatchIdempotencyKey) : void 0;
    const response = await tracer.startActiveSpan(name, async (span) => {
      const result = await executeBatchTwoPhaseStreaming(apiClient, transformedItems, {
        parentRunId: ctx?.run.id,
        idempotencyKey: streamBatchIdempotencyKey?.toString(),
        idempotencyKeyOptions: streamBatchIdempotencyKeyOptions,
        spanParentAsLink: true
        // Fire-and-forget: child runs get separate trace IDs
      }, requestOptions);
      span.setAttribute("batchId", result.id);
      span.setAttribute("runCount", result.runCount);
      return result;
    }, {
      kind: SpanKind.PRODUCER,
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "trigger",
        ...accessoryAttributes({
          items: [
            {
              text: taskIdentifier,
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
    const handle = {
      batchId: response.id,
      runCount: response.runCount,
      publicAccessToken: response.publicAccessToken
    };
    return handle;
  }
}
__name(batchTrigger_internal, "batchTrigger_internal");
async function triggerAndWait_internal(name, id, payload, parsePayload, options, requestOptions) {
  const ctx = taskContext.ctx;
  if (!ctx) {
    throw new Error("triggerAndWait can only be used from inside a task.run()");
  }
  const apiClient = apiClientManager.clientOrThrow(requestOptions?.clientConfig);
  const parsedPayload = parsePayload ? await parsePayload(payload) : payload;
  const { packet: triggerPayloadPacket, payloadSize } = await prepareTriggerPayload(parsedPayload, apiClient);
  const processedIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
  const idempotencyKeyOptions = processedIdempotencyKey ? getIdempotencyKeyOptions(processedIdempotencyKey) : void 0;
  return await tracer.startActiveSpan(name, async (span) => {
    const response = await apiClient.triggerTask(id, {
      payload: triggerPayloadPacket.data,
      options: {
        lockToVersion: taskContext.worker?.version,
        // Lock to current version because we're waiting for it to finish
        ...triggerQueueBody(options?.queue),
        ...triggerConcurrencyBody(options?.concurrency),
        concurrencyKey: options?.concurrencyKey,
        test: taskContext.ctx?.run.isTest,
        payloadType: triggerPayloadPacket.dataType,
        payloadSize,
        delay: options?.delay,
        ttl: options?.ttl,
        tags: options?.tags,
        maxAttempts: options?.maxAttempts,
        metadata: options?.metadata,
        maxDuration: options?.maxDuration,
        resumeParentOnCompletion: true,
        parentRunId: ctx.run.id,
        idempotencyKey: processedIdempotencyKey?.toString(),
        idempotencyKeyTTL: options?.idempotencyKeyTTL,
        idempotencyKeyOptions,
        machine: options?.machine,
        priority: options?.priority,
        region: options?.region,
        debounce: options?.debounce
      }
    }, {}, requestOptions);
    span.setAttribute("runId", response.id);
    const result = await runtime.waitForTask({
      id: response.id,
      ctx
    });
    return await handleTaskRunExecutionResult(result, id);
  }, {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SemanticInternalAttributes.STYLE_ICON]: "trigger",
      ...accessoryAttributes({
        items: [
          {
            text: id,
            variant: "normal"
          }
        ],
        style: "codepath"
      })
    }
  });
}
__name(triggerAndWait_internal, "triggerAndWait_internal");
async function triggerAndSubscribe_internal(name, id, payload, parsePayload, options, requestOptions) {
  const ctx = taskContext.ctx;
  if (!ctx) {
    throw new Error("triggerAndSubscribe can only be used from inside a task.run()");
  }
  const apiClient = apiClientManager.clientOrThrow(requestOptions?.clientConfig);
  const parsedPayload = parsePayload ? await parsePayload(payload) : payload;
  const { packet: triggerPayloadPacket, payloadSize } = await prepareTriggerPayload(parsedPayload, apiClient);
  const processedIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
  const idempotencyKeyOptions = processedIdempotencyKey ? getIdempotencyKeyOptions(processedIdempotencyKey) : void 0;
  return await tracer.startActiveSpan(name, async (span) => {
    const response = await apiClient.triggerTask(id, {
      payload: triggerPayloadPacket.data,
      options: {
        lockToVersion: taskContext.worker?.version,
        ...triggerQueueBody(options?.queue),
        ...triggerConcurrencyBody(options?.concurrency),
        concurrencyKey: options?.concurrencyKey,
        test: taskContext.ctx?.run.isTest,
        payloadType: triggerPayloadPacket.dataType,
        payloadSize,
        delay: options?.delay,
        ttl: options?.ttl,
        tags: options?.tags,
        maxAttempts: options?.maxAttempts,
        metadata: options?.metadata,
        maxDuration: options?.maxDuration,
        parentRunId: ctx.run.id,
        // NOTE: no resumeParentOnCompletion — parent stays alive and subscribes
        idempotencyKey: processedIdempotencyKey?.toString(),
        idempotencyKeyTTL: options?.idempotencyKeyTTL,
        idempotencyKeyOptions,
        machine: options?.machine,
        priority: options?.priority,
        region: options?.region,
        debounce: options?.debounce
      }
    }, {}, requestOptions);
    span.setAttribute("messaging.message.id", response.id);
    span.setAttribute("runId", response.id);
    span.setAttribute(SemanticInternalAttributes.ENTITY_TYPE, "run");
    span.setAttribute(SemanticInternalAttributes.ENTITY_ID, response.id);
    const cancelOnAbort = options?.cancelOnAbort !== false;
    let onAbort;
    if (options?.signal && cancelOnAbort) {
      if (options.signal.aborted) {
        await apiClient.cancelRun(response.id).catch(() => {
        });
        throw new DOMException("Aborted", "AbortError");
      }
      onAbort = /* @__PURE__ */ __name(() => {
        apiClient.cancelRun(response.id).catch(() => {
        });
      }, "onAbort");
      options.signal.addEventListener("abort", onAbort, { once: true });
    }
    try {
      for await (const run of apiClient.subscribeToRun(response.id, {
        closeOnComplete: true,
        signal: options?.signal,
        skipColumns: ["payload"]
      })) {
        if (run.isSuccess) {
          return {
            ok: true,
            id: response.id,
            taskIdentifier: id,
            output: run.output
          };
        }
        if (run.isFailed || run.isCancelled) {
          const cause = run.error?.causes?.length ? createErrorFromCauses(run.error.causes) : void 0;
          const error = new Error(run.error?.message ?? `Task ${id} failed (${run.status})`, cause ? { cause } : void 0);
          if (run.error?.name)
            error.name = run.error.name;
          return {
            ok: false,
            id: response.id,
            taskIdentifier: id,
            error
          };
        }
      }
      throw new Error(`Task ${id}: subscription ended without completion`);
    } finally {
      if (onAbort && options?.signal) {
        options.signal.removeEventListener("abort", onAbort);
      }
    }
  }, {
    kind: SpanKind.PRODUCER,
    attributes: {
      [SemanticInternalAttributes.STYLE_ICON]: "trigger",
      ...accessoryAttributes({
        items: [
          {
            text: id,
            variant: "normal"
          }
        ],
        style: "codepath"
      })
    }
  });
}
__name(triggerAndSubscribe_internal, "triggerAndSubscribe_internal");
async function batchTriggerAndWait_internal(name, id, items, parsePayload, options, requestOptions, queue) {
  const ctx = taskContext.ctx;
  if (!ctx) {
    throw new Error("batchTriggerAndWait can only be used from inside a task.run()");
  }
  const apiClient = apiClientManager.clientOrThrow(requestOptions?.clientConfig);
  if (Array.isArray(items)) {
    const ndJsonItems = await Promise.all(items.map(async (item, index) => {
      const parsedPayload = parsePayload ? await parsePayload(item.payload) : item.payload;
      const payloadPacket = await stringifyIO(parsedPayload);
      const batchItemIdempotencyKey = await makeIdempotencyKey(flattenIdempotencyKey([options?.idempotencyKey, `${index}`]));
      const itemIdempotencyKey = await makeIdempotencyKey(item.options?.idempotencyKey);
      const finalIdempotencyKey = itemIdempotencyKey ?? batchItemIdempotencyKey;
      const idempotencyKeyOptions = itemIdempotencyKey ? getIdempotencyKeyOptions(itemIdempotencyKey) : void 0;
      return {
        index,
        task: id,
        payload: payloadPacket.data,
        options: {
          lockToVersion: taskContext.worker?.version,
          ...triggerQueueBody(item.options?.queue, queue),
          ...triggerConcurrencyBody(item.options?.concurrency),
          concurrencyKey: item.options?.concurrencyKey,
          test: taskContext.ctx?.run.isTest,
          payloadType: payloadPacket.dataType,
          delay: item.options?.delay,
          ttl: item.options?.ttl,
          tags: item.options?.tags,
          maxAttempts: item.options?.maxAttempts,
          metadata: item.options?.metadata,
          maxDuration: item.options?.maxDuration,
          idempotencyKey: finalIdempotencyKey?.toString(),
          idempotencyKeyTTL: item.options?.idempotencyKeyTTL ?? options?.idempotencyKeyTTL,
          idempotencyKeyOptions,
          machine: item.options?.machine,
          priority: item.options?.priority,
          region: item.options?.region,
          debounce: item.options?.debounce
        }
      };
    }));
    const batchIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
    const batchIdempotencyKeyOptions = batchIdempotencyKey ? getIdempotencyKeyOptions(batchIdempotencyKey) : void 0;
    return await tracer.startActiveSpan(name, async (span) => {
      const response = await executeBatchTwoPhase(apiClient, ndJsonItems, {
        parentRunId: ctx.run.id,
        resumeParentOnCompletion: true,
        idempotencyKey: batchIdempotencyKey?.toString(),
        idempotencyKeyOptions: batchIdempotencyKeyOptions,
        spanParentAsLink: false
        // Waiting: child runs share parent's trace ID
      }, requestOptions);
      span.setAttribute("batchId", response.id);
      span.setAttribute("runCount", response.runCount);
      const result = await runtime.waitForBatch({
        id: response.id,
        runCount: response.runCount,
        ctx
      });
      const runs = await handleBatchTaskRunExecutionResult(result.items, id);
      return {
        id: result.id,
        runs
      };
    }, {
      kind: SpanKind.PRODUCER,
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "trigger",
        ...accessoryAttributes({
          items: [
            {
              text: id,
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
  } else {
    const asyncItems = normalizeToAsyncIterable(items);
    const transformedItems = transformSingleTaskBatchItemsStreamForWait(id, asyncItems, parsePayload, options, queue);
    const streamBatchIdempotencyKey = await makeIdempotencyKey(options?.idempotencyKey);
    const streamBatchIdempotencyKeyOptions = streamBatchIdempotencyKey ? getIdempotencyKeyOptions(streamBatchIdempotencyKey) : void 0;
    return await tracer.startActiveSpan(name, async (span) => {
      const response = await executeBatchTwoPhaseStreaming(apiClient, transformedItems, {
        parentRunId: ctx.run.id,
        resumeParentOnCompletion: true,
        idempotencyKey: streamBatchIdempotencyKey?.toString(),
        idempotencyKeyOptions: streamBatchIdempotencyKeyOptions,
        spanParentAsLink: false
        // Waiting: child runs share parent's trace ID
      }, requestOptions);
      span.setAttribute("batchId", response.id);
      span.setAttribute("runCount", response.runCount);
      const result = await runtime.waitForBatch({
        id: response.id,
        runCount: response.runCount,
        ctx
      });
      const runs = await handleBatchTaskRunExecutionResult(result.items, id);
      return {
        id: result.id,
        runs
      };
    }, {
      kind: SpanKind.PRODUCER,
      attributes: {
        [SemanticInternalAttributes.STYLE_ICON]: "trigger",
        ...accessoryAttributes({
          items: [
            {
              text: id,
              variant: "normal"
            }
          ],
          style: "codepath"
        })
      }
    });
  }
}
__name(batchTriggerAndWait_internal, "batchTriggerAndWait_internal");
async function handleBatchTaskRunExecutionResult(items, taskIdentifier) {
  const someObjectStoreOutputs = items.some((item) => item.ok && item.outputType === "application/store");
  if (!someObjectStoreOutputs) {
    const results = await Promise.all(items.map(async (item) => {
      return await handleTaskRunExecutionResult(item, taskIdentifier);
    }));
    return results;
  }
  return await tracer.startActiveSpan("store.downloadPayloads", async (span) => {
    const results = await Promise.all(items.map(async (item) => {
      return await handleTaskRunExecutionResult(item, taskIdentifier);
    }));
    return results;
  }, {
    kind: SpanKind.INTERNAL,
    [SemanticInternalAttributes.STYLE_ICON]: "cloud-download"
  });
}
__name(handleBatchTaskRunExecutionResult, "handleBatchTaskRunExecutionResult");
async function handleTaskRunExecutionResult(execution, taskIdentifier) {
  if (execution.ok) {
    const outputPacket = { data: execution.output, dataType: execution.outputType };
    const importedPacket = await conditionallyImportPacket(outputPacket, tracer);
    return {
      ok: true,
      id: execution.id,
      taskIdentifier: execution.taskIdentifier ?? taskIdentifier,
      output: await parsePacket(importedPacket)
    };
  } else {
    return {
      ok: false,
      id: execution.id,
      taskIdentifier: execution.taskIdentifier ?? taskIdentifier,
      error: createErrorTaskError(execution.error)
    };
  }
}
__name(handleTaskRunExecutionResult, "handleTaskRunExecutionResult");
function registerTaskLifecycleHooks(taskId, params) {
  if (params.init) {
    lifecycleHooks.registerTaskInitHook(taskId, {
      fn: params.init
    });
  }
  if (params.onStart) {
    lifecycleHooks.registerTaskStartHook(taskId, {
      fn: params.onStart
    });
  }
  if (params.onStartAttempt) {
    lifecycleHooks.registerTaskStartAttemptHook(taskId, {
      fn: params.onStartAttempt
    });
  }
  if (params.onFailure) {
    lifecycleHooks.registerTaskFailureHook(taskId, {
      fn: params.onFailure
    });
  }
  if (params.onSuccess) {
    lifecycleHooks.registerTaskSuccessHook(taskId, {
      fn: params.onSuccess
    });
  }
  if (params.onComplete) {
    lifecycleHooks.registerTaskCompleteHook(taskId, {
      fn: params.onComplete
    });
  }
  if (params.onWait) {
    lifecycleHooks.registerTaskWaitHook(taskId, {
      fn: params.onWait
    });
  }
  if (params.onResume) {
    lifecycleHooks.registerTaskResumeHook(taskId, {
      fn: params.onResume
    });
  }
  if (params.catchError) {
    lifecycleHooks.registerTaskCatchErrorHook(taskId, {
      fn: params.catchError
    });
  }
  if (params.handleError) {
    lifecycleHooks.registerTaskCatchErrorHook(taskId, {
      fn: params.handleError
    });
  }
  if (params.middleware) {
    lifecycleHooks.registerTaskMiddlewareHook(taskId, {
      fn: params.middleware
    });
  }
  if (params.cleanup) {
    lifecycleHooks.registerTaskCleanupHook(taskId, {
      fn: params.cleanup
    });
  }
  if (params.onCancel) {
    lifecycleHooks.registerTaskCancelHook(taskId, {
      fn: params.onCancel
    });
  }
}
__name(registerTaskLifecycleHooks, "registerTaskLifecycleHooks");
async function prepareTriggerPayload(payload, apiClient) {
  const payloadPacket = await stringifyIO(payload);
  const { size: payloadSize } = packetRequiresOffloading(payloadPacket);
  const packet = await conditionallyExportPacket(payloadPacket, createTriggerPayloadPathPrefix(), void 0, apiClient);
  return { packet, payloadSize };
}
__name(prepareTriggerPayload, "prepareTriggerPayload");
function createTriggerPayloadPathPrefix() {
  return `trigger/${generateFriendlyId("packet")}/payload`;
}
__name(createTriggerPayloadPathPrefix, "createTriggerPayloadPathPrefix");

// node_modules/@trigger.dev/sdk/dist/esm/v3/tasks.js
var task = createTask;

// node_modules/@trigger.dev/sdk/dist/esm/v3/index.js
init_esm();

export {
  defineConfig,
  task
};
//# sourceMappingURL=chunk-HW3KSO2P.mjs.map
