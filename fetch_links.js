import https from 'https';

https.get('https://autoencoder-embeddings-playground-303001901203.us-west1.run.app/assets/index-CQAFDICg.js', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const links = data.match(/https:\/\/[^"']+/g) || [];
    const relevant = links.filter(l => l.includes('github') || l.includes('david'));
    console.log(Array.from(new Set(relevant)).join('\n'));
  });
});
