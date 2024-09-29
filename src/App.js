import React, { useState } from 'react';

function App() {
  const [log, setLog] = useState([]);
  const [port, setPort] = useState(null);
  const [reader, setReader] = useState(null);
  const [buffer, setBuffer] = useState('');

  const requestPort = async () => {
    try {
      const port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x01a86 }],
      });
      await port.open({ baudRate: 9600 });
      setPort(port);

      const textDecoder = new TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();
      setReader(reader);

      readData(reader);
    } catch (error) {
      console.error('Error accessing serial port:', error);
    }
  };

  const readData = async (reader) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const decodedValue = value;
        setBuffer((prevBuffer) => {
          const newBuffer = prevBuffer + decodedValue;
          const crlfIndex = newBuffer.indexOf('\r');
          if (crlfIndex !== -1) {
            const completeLine = newBuffer.slice(0, crlfIndex);
            setLog((prevLog) => [...prevLog, completeLine]);
            return newBuffer.slice(crlfIndex + 2); 
          }
          return newBuffer;
        });
      }
    } catch (error) {
      console.error('Error reading from serial port:', error);
    }
  };

  const closePort = async () => {
    if (reader) {
      await reader.cancel(); 
      await reader.releaseLock(); 
      setReader(null);
    }
    if (port) {
      await port.close(); 
      setPort(null);
    }
    setBuffer(''); 
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <h1>React Barcode Reader using Web Serial API</h1>
        {!port ? (
          <button onClick={requestPort}>Connect Barcode Scanner</button>
        ) : (
          <button onClick={closePort}>Disconnect</button>
        )}
        <h3 style={{ marginTop: '20px' }}>Logs</h3>
        <div
          style={{
            marginTop: '10px',
            width: '80%',
            height: '300px',
            overflowY: 'scroll',
            border: '1px solid #ccc',
            padding: '10px',
            backgroundColor: '#f1f1f1',
            fontFamily: 'monospace',
            color: '#333',
            whiteSpace: 'pre-wrap',
          }}
        >
          {log.length > 0 ? (
            log.map((item, index) => (
              <p key={index} style={{ margin: '5px 0' }}>
                {item}
              </p>
            ))
          ) : (
            <p>No barcodes scanned yet.</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
