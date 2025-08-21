/* eslint-disable @typescript-eslint/no-explicit-any */
import { GrowthBook } from "../GrowthBook.mjs";
import { UserScopedGrowthBook } from "../GrowthBookClient.mjs";
function applyDevtoolsState(devtoolsState, gb) {
  // Only enable in dev mode
  if (!gb.inDevMode()) {
    return;
  }
  if (devtoolsState.attributes && typeof devtoolsState.attributes === "object") {
    gb.setAttributeOverrides(devtoolsState.attributes);
  }
  if (devtoolsState.features && typeof devtoolsState.features === "object") {
    const map = new Map(Object.entries(devtoolsState.features));
    gb.setForcedFeatures(map);
  }
  if (devtoolsState.experiments && typeof devtoolsState.experiments === "object") {
    gb.setForcedVariations(devtoolsState.experiments);
  }
}
export function devtoolsPlugin(devtoolsState) {
  return gb => {
    // Only works for user-scoped GrowthBook instances
    if ("createScopedInstance" in gb) {
      throw new Error("devtoolsPlugin can only be set on a user-scoped instance");
    }
    if (devtoolsState) {
      applyDevtoolsState(devtoolsState, gb);
    }
  };
}

/**
 * For NextJS environments.
 * When using server components, use the `searchParams` and `requestCookies` fields.
 *  - Note: In NextJS 15+, you should await these values before passing them to the plugin
 * When using middleware / api routes, provide the `request` field instead.
 */
export function devtoolsNextjsPlugin(_ref) {
  let {
    searchParams,
    requestCookies,
    request
  } = _ref;
  function extractGbDebugPayload(_ref2) {
    var _requestCookies$get;
    let {
      searchParams,
      requestCookies
    } = _ref2;
    if (searchParams) {
      if ("_gbdebug" in searchParams) {
        return searchParams._gbdebug;
      }
      if (searchParams instanceof URLSearchParams) {
        return searchParams.get("_gbdebug") ?? undefined;
      }
    }
    return requestCookies === null || requestCookies === void 0 ? void 0 : (_requestCookies$get = requestCookies.get("_gbdebug")) === null || _requestCookies$get === void 0 ? void 0 : _requestCookies$get.value;
  }
  return gb => {
    let payload = extractGbDebugPayload({
      searchParams,
      requestCookies
    });
    if (!payload && request) {
      payload = extractGbDebugPayload({
        searchParams: request.nextUrl.searchParams,
        requestCookies: request.cookies
      });
    }
    let state = {};
    if (payload) {
      try {
        state = JSON.parse(payload);
      } catch (e) {
        console.error("cannot parse devtools payload", e);
      }
    }
    devtoolsPlugin(state)(gb);
  };
}

/**
 * Intended to be used with cookieParser() middleware from npm: 'cookie-parser'.
 */
export function devtoolsExpressPlugin(_ref3) {
  let {
    request
  } = _ref3;
  return gb => {
    var _request$query;
    let payload = typeof (request === null || request === void 0 ? void 0 : (_request$query = request.query) === null || _request$query === void 0 ? void 0 : _request$query["_gbdebug"]) === "string" ? request.query["_gbdebug"] : undefined;
    if (!payload) {
      var _request$cookies;
      payload = typeof (request === null || request === void 0 ? void 0 : (_request$cookies = request.cookies) === null || _request$cookies === void 0 ? void 0 : _request$cookies["_gbdebug"]) === "string" ? request.cookies["_gbdebug"] : undefined;
    }
    let state = {};
    if (payload) {
      try {
        state = JSON.parse(payload);
      } catch (e) {
        console.error("cannot parse devtools payload", e);
      }
    }
    devtoolsPlugin(state)(gb);
  };
}
/**
 * Helper method to get debug script contents for DevTools
 * @param gb - GrowthBook instance. DevMode must be enabled to view log events.
 * @param {string} [source] - Label these events for ease of reading in DevTools
 * @example
 * A React logger component (implement yourself):
 ```
  return (
    <script dangerouslySetInnerHTML={{
      __html: getDebugScriptContents(gb, "nextjs")
    }} />
  );
 ```
 */
export function getDebugScriptContents(gb, source) {
  const event = getDebugEvent(gb, source);
  if (!event) return "";
  return `(window._gbdebugEvents = (window._gbdebugEvents || [])).push(${JSON.stringify(event)});`;
}
export function getDebugEvent(gb, source) {
  if (!("logs" in gb)) return null;
  // Only enable in dev mode
  if (!gb.inDevMode()) {
    return null;
  }
  if (gb instanceof GrowthBook) {
    // GrowthBook SDK
    const [apiHost, clientKey] = gb.getApiInfo();
    return {
      logs: gb.logs,
      sdkInfo: {
        apiHost,
        clientKey,
        source,
        version: gb.version,
        payload: gb.getDecryptedPayload(),
        attributes: gb.getAttributes()
      }
    };
  } else if (gb instanceof UserScopedGrowthBook) {
    // UserScopedGrowthBook SDK
    const userContext = gb.getUserContext();
    const [apiHost, clientKey] = gb.getApiInfo();
    return {
      logs: gb.logs,
      sdkInfo: {
        apiHost,
        clientKey,
        source,
        version: gb.getVersion(),
        payload: gb.getDecryptedPayload(),
        attributes: {
          ...userContext.attributes,
          ...userContext.attributeOverrides
        }
      }
    };
  }
  return null;
}
//# sourceMappingURL=devtools.mjs.map