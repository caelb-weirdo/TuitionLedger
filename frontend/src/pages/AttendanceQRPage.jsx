import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { classService } from '../services/classService';
import { attendanceService } from '../services/attendanceService';
import { settingsService } from '../services/feeService';
import { useToast } from '../context/ToastContext';

export default function AttendanceQRPage() {
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState(searchParams.get('class_id') || '');
  const [qrMinutes, setQrMinutes] = useState(5);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [presentCount, setPresentCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef(null);
  const { showToast } = useToast();

  useEffect(() => {
    classService.getAll().then((res) => setClasses(res.data.classes));
    settingsService.get().then((res) => setQrMinutes(res.data.default_qr_minutes || 5));
  }, []);

  useEffect(() => {
    if (!session) return;
    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(session.expires_at) - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining > 0) {
        attendanceService.getSession(session.session_token).then((res) => {
          setPresentCount(res.data.present_count);
        }).catch(() => {});
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
    return () => clearInterval(timerRef.current);
  }, [session]);

  const generate = async () => {
    if (!classId) { showToast('Select a class', 'warning'); return; }
    setGenerating(true);
    try {
      const res = await attendanceService.createSession(classId, qrMinutes);
      setSession(res.data);
      showToast('QR session created!', 'success');
    } catch (err) { showToast(err.message, 'error'); }
    finally { setGenerating(false); }
  };

  const closeSession = async () => {
    if (!session) return;
    try {
      await attendanceService.closeSession(session.session_id);
      showToast('Session closed. Absent records created.', 'success');
      setSession(null);
    } catch (err) { showToast(err.message, 'error'); }
  };

  const downloadQR = () => {
    const svg = document.querySelector('.qr-container svg');
    if (!svg) return;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = 'attendance-qr.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div className="qr-page">
      <div className="page-header">
        <h1>Generate Attendance QR</h1>
        <p>Students scan this QR code with their phone camera to mark attendance.</p>
      </div>

      {!session ? (
        <div className="card" style={{ textAlign: 'left' }}>
          <div className="form-group"><label>Select Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">Choose a class...</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.class_name} — {c.subject}</option>)}
            </select>
          </div>
          <div className="form-group"><label>QR Time Limit</label>
            <select value={qrMinutes} onChange={(e) => setQrMinutes(Number(e.target.value))}>
              <option value={3}>3 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
            </select>
          </div>
          <button className="btn btn-success btn-lg" onClick={generate} disabled={generating}>
            {generating ? <span className="spinner"></span> : <><i className="fas fa-qrcode"></i> Generate QR</>}
          </button>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3>{selectedClass?.class_name || session.class_name}</h3>
            <p className="text-secondary">{selectedClass?.subject}</p>
            <p>Present: <strong>{presentCount}</strong></p>
          </div>

          <div className={`qr-timer ${timeLeft === 0 ? 'expired' : ''}`}>
            {timeLeft > 0 ? <>Expires in: {formatTime(timeLeft)}</> : 'QR Expired'}
          </div>

          <div className="qr-container">
            <QRCodeSVG value={session.qr_link} size={280} level="H" includeMargin />
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={downloadQR}><i className="fas fa-download"></i> Download QR</button>
            <button className="btn btn-danger" onClick={closeSession}><i className="fas fa-stop"></i> Close Session</button>
            <button className="btn btn-primary" onClick={() => setSession(null)}><i className="fas fa-redo"></i> New QR</button>
          </div>
        </>
      )}
    </div>
  );
}
