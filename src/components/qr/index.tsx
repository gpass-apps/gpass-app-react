import { useRef, useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import '../../index.css';
import SaveButton from "../saveButton";
import { SecurityScanOutlined } from "@ant-design/icons";

const QRScan = ({ ...rest }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const videoStyle = {
    width: '100%',
    height: '65%', // Asegura que el video ocupe el 70% del espacio del contenedor
    objectFit: 'cover'
  };

  const mobileVideoStyle = {
    ...videoStyle,
    paddingLeft: '7%',
    paddingRight: '7%',
    height: '55%',
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  const toggleCamera = async () => {
    try {
      setLoading(true)
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOn(!isCameraOn);
    } catch (error) {
      console.error('Error accessing camera:', error);
    } finally {
      setLoading(false)
    }
  };

  return (
    <div >
      {
        rest?.type === "Data" && <SaveButton
          icon={<SecurityScanOutlined />}
          onClick={toggleCamera}
          loading={loading}
          style={{}}
        >
          {isCameraOn ? 'Apagar cámara' : 'Encender cámara'}
        </SaveButton>
      }

      {isCameraOn && (
        <div className="container">
          <img src={rest?.img} style={{ width: "100%", height: "70vh", objectFit: "contain" }} />
          <div className={!isMobile ? "content" : "movil-content"}>
            <video ref={videoRef} autoPlay playsInline />
            <QrReader
              constraints={{ facingMode: 'environment' }}
              videoStyle={!isMobile ? videoStyle : mobileVideoStyle}
              {...rest}
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default QRScan;