(function(){console.log("PhishBlocker content script loaded");chrome.runtime.onMessage.addListener((t,e,n)=>{t.action==="showWarning"&&o(t.data)});function o(t){const e=document.createElement("div");e.id="phishblocker-warning",e.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.95);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,e.innerHTML=`
    <div style="
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 500px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border-radius: 50%;
        margin: 0 auto 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse 2s infinite;
      ">
        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
          <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
        </svg>
      </div>
      
      <h1 style="
        font-size: 28px;
        font-weight: bold;
        color: #1f2937;
        margin: 0 0 10px 0;
      ">
        ⚠️ Phishing Warning
      </h1>
      
      <p style="
        font-size: 16px;
        color: #6b7280;
        margin: 0 0 20px 0;
        line-height: 1.6;
      ">
        PhishBlocker has detected that this website may be attempting to steal your personal information.
      </p>
      
      <div style="
        background: #fef2f2;
        border: 2px solid #fecaca;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 24px;
        text-align: left;
      ">
        <p style="
          font-size: 14px;
          color: #991b1b;
          margin: 0 0 8px 0;
          font-weight: 600;
        ">
          Threat Level: <span style="color: #dc2626;">${t.threat_level}</span>
        </p>
        <p style="
          font-size: 14px;
          color: #991b1b;
          margin: 0;
        ">
          Confidence: <span style="color: #dc2626;">${(t.confidence*100).toFixed(1)}%</span>
        </p>
      </div>
      
      <div style="display: flex; gap: 12px; justify-content: center;">
        <button id="phishblocker-back" style="
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          ← Go Back to Safety
        </button>
        
        <button id="phishblocker-proceed" style="
          background: transparent;
          color: #6b7280;
          border: 2px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        ">
          Proceed Anyway
        </button>
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      
      #phishblocker-back:hover {
        transform: translateY(-2px);
      }
      
      #phishblocker-proceed:hover {
        background: #f3f4f6;
        border-color: #9ca3af;
      }
    </style>
  `,document.body.appendChild(e),document.getElementById("phishblocker-back").addEventListener("click",()=>{window.history.back()}),document.getElementById("phishblocker-proceed").addEventListener("click",()=>{e.remove()})}
})()
