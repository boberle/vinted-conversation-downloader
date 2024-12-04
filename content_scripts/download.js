(() => {
  if (window.hasRun) {
    return;
  }
  window.hasRun = true;

  const download = (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType });
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

  const getProductUrl = () => {
    const productId = window.location.href.match(/(?<=\/)\d+(?=-)/).pop();
    const tld = window.location.host
        .match(/\.[a-z]+$/)
        .pop()
        .slice(1);
    const productUrl = `https://www.vinted.${tld}/api/v2/items/${productId}?localize=false&noredirect=1`;
    return [productId, productUrl, tld];
  };

  browser.runtime.onMessage.addListener(async (message) => {
    if (message.command === "download-conversation") {
      const [conversationId, conversationUrl] = getConversationUrl();
      const filename = `vinted-conversation-${conversationId}.json`;
      const fetched = await fetch(conversationUrl);
      const data = await fetched.text();
      download(data, filename, "application/json");

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
        download(shipmentData, filename, "application/json");
      } else {
        throw new Error("No shipment ID found");
      }

    } else if (message.command === "download-images") {
      const [conversationId, conversationUrl, tld] = getConversationUrl();
      const fetched = await fetch(conversationUrl);
      const data = await fetched.json();
      data?.conversation?.messages?.forEach(message => {
        message.entity?.photos?.forEach(async photo => {
          const filename = `vinted-conversation-${conversationId}-photo-${photo.id}.jpg`;
          const photoUrl = photo.full_size_url;
          const photoFetched = await fetch(photoUrl);
          const photoData = await photoFetched.arrayBuffer();
          download(photoData, filename, "application/octet-stream");
        })
      })

    } else if (message.command === "download-product") {
      const [productId, productUrl] = getProductUrl();
      const filename = `vinted-item-${productId}.json`;
      const fetched = await fetch(productUrl);
      const data = await fetched.text();
      download(data, filename, "application/json");

    } else if (message.command === "download-summary") {
      const [productId, productUrl] = getProductUrl();
      const filename = `vinted-item-${productId}-summary.txt`;
      const fetched = await fetch(productUrl);
      const data = await fetched.json();
      const summary = (
          `id: ${productId}\n` +
          `source: ${productUrl}\n` +
          `title: ${data?.item?.title}\n` +
          `description: ${data?.item?.description}\n` +
          `seller: ${data?.item?.user?.login}\n` +
          `seller id: ${data?.item?.user?.id}`
      )
      download(summary, filename, "text/plain");

    } else if (message.command === "download-photos") {
      const [productId, productUrl, tld] = getProductUrl();
      const fetched = await fetch(productUrl);
      const data = await fetched.json();
      data?.item?.photos?.forEach(async photo => {
        const filename = `vinted-item-${productId}-photo-${photo.id}.jpg`;
        const photoUrl = photo.full_size_url;
        const photoFetched = await fetch(photoUrl);
        const photoData = await photoFetched.arrayBuffer();
        download(photoData, filename, "application/octet-stream");
        console.log(photoUrl, filename);
      })
    }

  });
})();
