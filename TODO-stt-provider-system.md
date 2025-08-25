# STT Provider System - Implementation Plan

## Overview

Create a central speech-to-text provider system that allows users to choose between Speechmatics (premium) and Web Speech API (free) as primary options, with smart auto-selection capabilities.

## Current State

- ✅ Speechmatics integration implemented with production-ready features
- ✅ JWT authentication via Cloudflare Workers
- ✅ Dual-transcript handling (partial + final)
- ✅ WebSocket reconnection logic
- ✅ React providers at app root

## Architecture Design

### 1. Provider Interface

Create common interface that all STT providers must implement:

- Core methods: `startListening()`, `stopListening()`
- Event handlers: `onTranscript`, `onError`
- Provider metadata: `name`, `displayName`, `requiresAuth`, `supportedLanguages`
- Keep providers separate from React hooks (separation of concerns)

### 2. File Structure

```
/src/lib/stt/
  providers/
    base-provider.ts         # Abstract base class
    speechmatics-provider.ts # Existing implementation wrapped
    webspeech-provider.ts    # New Web Speech API implementation
  hooks/
    useSTTProvider.ts       # Main hook (single entry point)
    useProviderSelector.ts  # Provider selection management
  types.ts                  # Shared TypeScript interfaces
  provider-factory.ts       # Provider instantiation logic
```

### 3. Provider Selection Strategy

- Store preference in localStorage: `'speechmatics' | 'webspeech' | 'auto'`
- Auto mode logic:
  1. Check Speechmatics JWT availability → use Speechmatics
  2. Check browser Web Speech support → use Web Speech
  3. Show error if neither available
- Instant provider switching without app restart

### 4. User Interface

- **Location**: Settings menu + quick toggle near mic button
- **Visual feedback**:
  - Provider name on hover
  - Different mic colors per provider
  - Loading states during switch
- **Error handling**: Show inline errors with quick switch option

### 5. Implementation Phases

#### Phase 1: Core Architecture (Priority: High)

- [ ] Create base provider interface and abstract class
- [ ] Create provider factory for instantiation
- [ ] Design TypeScript types for common interfaces

#### Phase 2: Provider Implementation (Priority: High)

- [ ] Wrap existing Speechmatics code in new provider interface
- [ ] Implement Web Speech API provider
- [ ] Add browser compatibility checking

#### Phase 3: React Integration (Priority: Medium)

- [ ] Create `useSTTProvider` hook as main entry point
- [ ] Create `useProviderSelector` for managing selection
- [ ] Add provider context for global state

#### Phase 4: UI Components (Priority: Medium)

- [ ] Create provider selector dropdown component
- [ ] Add visual indicators for active provider
- [ ] Implement settings page integration

#### Phase 5: Enhancement (Priority: Low)

- [ ] Add provider capability system
- [ ] Implement lazy loading for providers
- [ ] Add analytics and cost tracking
- [ ] Create debug mode for troubleshooting

## Technical Decisions

1. **State Management**: Provider state internal, UI state in hooks, selection in localStorage
2. **Error Handling**: Never auto-switch providers without user consent
3. **Performance**: Lazy load provider code, cache instances
4. **Migration**: No breaking changes - wrap existing code first
5. **Extensibility**: Easy to add new providers via interface implementation

## Future Providers to Consider

- OpenAI Whisper (file-based)
- Google Cloud Speech-to-Text
- Azure Cognitive Services
- AssemblyAI
- Deepgram

## Notes

- Web Speech API has ~60% browser coverage (Chrome, partial Safari)
- Speechmatics remains primary for production quality
- This architecture allows easy A/B testing of providers
- Consider adding provider recommendations based on use case

## Related Files

- Current implementation: `/src/hooks/useSpeechToText.ts`
- Speechmatics providers: `/src/components/providers/SpeechProviders.tsx`
- Mic button component: `/src/components/ScenarioInput.tsx`

---

_Created: 2024-11-25_
_Status: Planning Phase_
_Priority: Medium-High (improves reliability and reduces costs)_
