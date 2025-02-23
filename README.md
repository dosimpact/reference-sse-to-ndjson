# SSE to NDJSON Demo  

현재 구현된 디렉터리 
/backend : nest.js project
/bff : nest.js project
/client : next.js project  

구현해야할 시나리오   

1.client에서 bff로 요청을 보낸다. 적절한 ui와 이를 처리하는 로직을 작성해줘  
- 요청 이름 request anlaysis by llm 등  
  
2.bff는 backend로 다시 요청을 보낸다.  backend는 이를 처리하고 바로 응답을 text로 내려주는거야 이때 sse 방식으로 내려주는것을 구현해   

3.bff는 이 청크 데이터를 받아서 createStreamableValue 으로 처리할꺼야 
- 아래 명세를 확인해  
- https://sdk.vercel.ai/docs/ai-sdk-rsc/streaming-values#createstreamablevalue

4.client에서 해당 데이터를 받아서 적절하게 화면에 보여주면 된다.  



