# SSE to NDJSON Demo  

현재 구현된 디렉터리 
/backend : nest.js project   
/bff : nest.js project  
/client : next.js project    

## 구현해야할 시나리오   

1.client에서 bff로 요청을 보낸다. 적절한 ui와 이를 처리하는 로직을 작성해줘  
- 요청 이름 request anlaysis by llm 등  
  
2.bff는 backend로 다시 요청을 보낸다.  backend는 이를 처리하고 바로 응답을 text로 내려주는거야 이때 sse 방식으로 내려주는것을 구현해   

3.bff는 이 청크 데이터를 받아서 createStreamableValue 으로 처리할꺼야 
- 아래 명세를 확인해  
- https://sdk.vercel.ai/docs/ai-sdk-rsc/streaming-values#createstreamablevalue

4.client에서 해당 데이터를 받아서 적절하게 화면에 보여주면 된다.  
- https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data#processing-custom-data-in-usechat

5.backend에서 SSE는 가끔씩 오류를 보낼 수 있어, 그런 경우에 대비해서 bff에서 애러 NDJSON 처리 및 UI표기 해줘.  

## 기술 비교: 웹 소켓 vs Server-Sent-Events vs 롱 폴링

### Long Polling (롱 폴링)
- 클라이언트가 서버에 주기적으로 요청을 보내 데이터가 있는지 확인
- 데이터가 없으면 일정 시간 후 서버가 응답 → 클라이언트가 다시 요청
- HTTP 요청이 반복되므로 비효율적 (오버헤드 큼)
- 사용 사례: 간단한 채팅, 알림 시스템

### Server-Sent Events (SSE)
- 서버에서 클라이언트로 단방향 스트리밍 가능
- HTTP 기반이므로 WebSocket보다 설정이 간단함
- 연결이 자동으로 재연결됨
- 사용 사례: 뉴스 피드, 주식 가격 업데이트, 실시간 알림

### WebSocket (웹소켓)
- 양방향 통신 가능 (Full Duplex)
- 서버와 클라이언트가 지속적으로 데이터를 주고받을 수 있음
- 헤더가 가벼워 성능이 뛰어남 (HTTP보다 효율적)
- 사용 사례: 실시간 채팅, 주식 거래, 온라인 게임

## SSE > NDJSON

Vercel AI SDK에서는 전형적인 SSE의 event: message\ndata: ... 형식이 아니라 Newline-delimited JSON (NDJSON) 형식을 따르는 점이 중요합니다.

## Next.js의 스트리밍 렌더링 방식

Next.js에서 스트리밍을 지원하는 주요 방법은 다음과 같습니다.
- React Server Components (RSC) 스트리밍
- fetch() API를 통한 서버 응답 스트리밍
- AI, LLM(대형 언어 모델) 응답 스트리밍 (useStreamable 등 활용)

## SSE의 한계

- data:{}라는 형식으로 불필요한 페이로드 및 가공 있음.
- Event Source API 필요하며, fetch 호환성 없음
  - IE, RN, Serverless 미지원
- HTTP/1.1 전용이라 HTTP/2 미지원
  - http/2 기반의 서버는 처리 불가

## 프로젝트 구조

```mermaid
graph TD;
    A[Client (Next.js)] --> B[BFF (Nest.js)];
    B --> C[Backend (Nest.js)];
    C -->|SSE| B;
    B -->|NDJSON| A;
```

