import React, { useRef, useState, useEffect } from 'react';

/**
 * VideoDemo component
 * - Upload a video or use the camera
 * - Capture frames periodically and send base64 frames to a Roboflow proxy
 * - Draw predictions as bounding boxes on a canvas
 *
 * Notes:
 * - The proxy URL is taken from REACT_APP_ROBOFLOW_PROXY_URL or defaults to http://localhost:4000/roboflow
 * - The client does NOT send any api_key; the proxy should inject it server-side.
 */

const PROXY_URL = process.env.REACT_APP_ROBOFLOW_PROXY_URL || 'http://localhost:4000/roboflow';

function stripDataUrlPrefix(dataUrl) {
  const comma = dataUrl.indexOf(',');
  return comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
}

const VideoDemo = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureTimerRef = useRef(null);

  const [mode, setMode] = useState(null); // 'upload' | 'camera' | null
  const [intervalMs, setIntervalMs] = useState(500);
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState([]);

  useEffect(() => {
    return () => {
      stopCapture();
      // stop camera if running
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = (e) => {
    stopCapture();
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const v = videoRef.current;
    v.srcObject = null;
    v.src = url;
    v.controls = true;
    v.play();
    setMode('upload');
  };

  const startCamera = async () => {
    stopCapture();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      const v = videoRef.current;
      v.srcObject = stream;
      v.play();
      setMode('camera');
    } catch (err) {
      console.error('Camera start error:', err);
      alert('Cannot access camera: ' + err.message);
    }
  };

  const captureFrameBase64 = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return null;
    const ctx = c.getContext('2d');
    // match canvas size to video
    const width = v.videoWidth || 320;
    const height = v.videoHeight || 240;
    c.width = width;
    c.height = height;
    try {
      ctx.drawImage(v, 0, 0, width, height);
      const dataUrl = c.toDataURL('image/jpeg', 0.8);
      return dataUrl;
    } catch (err) {
      console.error('capture error', err);
      return null;
    }
  };

  // Replace the direct Roboflow URL with your proxy and remove sending api_key from the client
  const sendFrameToRoboflow = async (frameDataUrl) => {
    const base64 = stripDataUrlPrefix(frameDataUrl);
    const payload = {
      // Do NOT include api_key here; the proxy will add it server-side
      inputs: {
        image: { type: 'base64', value: base64 }
      }
    };

    try {
      const resp = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await resp.json();
      if (json && json.predictions) {
        setPredictions(json.predictions);
      } else {
        setPredictions([]);
      }
      return json;
    } catch (err) {
      console.error('Roboflow proxy request error', err);
      return null;
    }
  };

  const overlayDetections = (frameDataUrl, preds = []) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const img = new Image();
    img.onload = () => {
      c.width = img.width;
      c.height = img.height;
      ctx.drawImage(img, 0, 0, c.width, c.height);

      ctx.lineWidth = 2;
      ctx.font = '16px Arial';

      preds.forEach((pred) => {
        // Try common bbox shapes: pred.x/y/width/height or pred.bbox.{x,y,width,height}
        let x = pred.x ?? pred.bbox?.x ?? 0;
        let y = pred.y ?? pred.bbox?.y ?? 0;
        let width = pred.width ?? pred.bbox?.width ?? pred.bbox?.w ?? 0;
        let height = pred.height ?? pred.bbox?.height ?? pred.bbox?.h ?? 0;

        // If normalized coordinates (0..1), convert to pixels
        if (x > 0 && x <= 1 && c.width) x = x * c.width;
        if (y > 0 && y <= 1 && c.height) y = y * c.height;
        if (width > 0 && width <= 1 && c.width) width = width * c.width;
        if (height > 0 && height <= 1 && c.height) height = height * c.height;

        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();

        ctx.fillStyle = 'red';
        const label = pred.class ?? pred.label ?? pred?.classification?.predicted_class ?? '';
        const conf = pred.confidence ?? pred?.score ?? null;
        const text = label + (conf ? ' ' + (conf * 100).toFixed(0) + '%' : '');
        ctx.fillText(text, Math.max(2, x), Math.max(14, y - 5));
      });
    };
    img.src = frameDataUrl;
  };

  const startCapture = () => {
    if (running) return;
    setRunning(true);

    const doCapture = async () => {
      const frame = captureFrameBase64();
      if (!frame) return;
      const res = await sendFrameToRoboflow(frame);
      overlayDetections(frame, (res && res.predictions) || []);
    };

    doCapture();
    captureTimerRef.current = setInterval(doCapture, intervalMs);
  };

  const stopCapture = () => {
    setRunning(false);
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
  };

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Video / Camera Demo (Roboflow via Proxy)</h3>

      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ minWidth: 260 }}>
          <div>
            <label>
              Upload video:
              <input type="file" accept="video/*" onChange={handleUpload} style={{ display: 'block', marginTop: 8 }} />
            </label>
          </div>

          <div style={{ marginTop: 10 }}>
            <button onClick={startCamera}>Start Camera</button>
          </div>

          <div style={{ marginTop: 10 }}>
            <label>
              Capture interval (ms):
              <input
                type="number"
                value={intervalMs}
                onChange={(e) => setIntervalMs(Number(e.target.value || 500))}
                style={{ width: 100, marginLeft: 8 }}
              />
            </label>
          </div>

          <div style={{ marginTop: 10 }}>
            {!running ? (
              <button onClick={startCapture} disabled={!mode}>
                Start Capture
              </button>
            ) : (
              <button onClick={stopCapture}>Stop Capture</button>
            )}
          </div>
        </div>

        <div>
          <div style={{ position: 'relative' }}>
            <video ref={videoRef} id="preview" style={{ maxWidth: 480 }} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'block', marginTop: 8, maxWidth: 480 }} />
          </div>

          <div style={{ marginTop: 8 }}>
            <small>Predictions will be drawn on the canvas below the video. Check DevTools console for raw proxy/Roboflow responses.</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDemo;