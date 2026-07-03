import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { deviceService } from '../services/attendanceService';
import { getDeviceToken, getDeviceInfo } from '../utils/deviceToken';
import Badge from '../components/Badge';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [deviceStatus, setDeviceStatus] = useState(null);

  useEffect(() => {
    const registerDevice = async () => {
      try {
        const statusRes = await deviceService.getStatus();
        setDeviceStatus(statusRes.data);
        if (statusRes.data.status === 'none') {
          const info = getDeviceInfo();
          await deviceService.request({
            device_token: getDeviceToken(),
            device_name: info.device_name,
            browser_info: info.browser_info,
          });
          const updated = await deviceService.getStatus();
          setDeviceStatus(updated.data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    registerDevice();
  }, []);

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h2>Hello, {user?.name}</h2>
        <p className="text-secondary">Scan a QR code from your tutor to mark attendance.</p>
      </div>

      <div className="card">
        <h3><i className="fas fa-mobile-alt"></i> Device Status</h3>
        {deviceStatus ? (
          <div style={{ marginTop: 12 }}>
            <Badge status={deviceStatus.status === 'approved' ? 'approved' : deviceStatus.status === 'rejected' ? 'rejected' : 'pending'} />
            <p style={{ marginTop: 8 }}>
              {deviceStatus.status === 'approved' && 'Your device is approved. You can mark attendance.'}
              {deviceStatus.status === 'pending' && 'Your device is pending tutor approval. Please wait.'}
              {deviceStatus.status === 'rejected' && `Device rejected: ${deviceStatus.reason || 'Contact your tutor.'}`}
              {deviceStatus.status === 'none' && 'Device registration submitted. Awaiting approval.'}
            </p>
          </div>
        ) : <div className="spinner spinner-dark"></div>}
      </div>

      <div className="card" style={{ marginTop: 16, textAlign: 'center', padding: 32 }}>
        <i className="fas fa-qrcode" style={{ fontSize: 48, color: 'var(--color-primary)', marginBottom: 16 }}></i>
        <h3>Ready to Scan</h3>
        <p className="text-secondary">Open your phone camera and scan the QR code displayed by your tutor.</p>
      </div>
    </div>
  );
}
