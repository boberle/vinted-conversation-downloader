(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const download = (data, filename) => {
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getConversationUrl = () => {
    const conversationId = window.location.href.match(/\d+$/).pop();
    const tld = window.location.host
      .match(/\.[a-z]+$/)
      .pop()
      .slice(1);
    const conversationUrl = `https://www.vinted.${tld}/api/v2/conversations/${conversationId}`;
    return [conversationId, conversationUrl, tld];
  };

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.command === "download-conversation") {
      const [conversationId, conversationUrl] = getConversationUrl();
      const filename = `vinted-conversation-${conversationId}.json`;
      const fetched = await fetch(conversationUrl);
      const data = await fetched.text();
      download(data, filename);
    } else if (message.command === "download-shipment") {
      const [conversationId, conversationUrl, tld] = getConversationUrl();
      const fetched = await fetch(conversationUrl);
      const data = await fetched.json();
      const shipmentId = data?.conversation?.transaction?.id;
      if (shipmentId) {
        const filename = `vinted-conversation-${conversationId}-shipment.json`;
        const shipmentUrl = `https://www.vinted.${tld}/api/v2/transactions/${shipmentId}/shipment/journey_summary`;
        const shipmentFetched = await fetch(shipmentUrl);
        const shipmentData = await shipmentFetched.text();
        download(shipmentData, filename);
      } else {
        throw new Error("No shipment ID found");
      }
    }
  });
})();
