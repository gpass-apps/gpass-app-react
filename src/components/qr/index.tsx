import React, { useRef, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import '../../index.css';
import SaveButton from "../saveButton";
import { SecurityScanOutlined } from "@ant-design/icons";
const img = "https://firebasestorage.googleapis.com/v0/b/gpass-apps.appspot.com/o/Events%2FWhatsApp%20Image%202023-08-22%20at%2018.54.26.jpeg?alt=media&token=148f184b-9fef-42b9-b99c-f74fb31ce315";

const QRScan = ({ ...rest }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(false);

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
      <SaveButton
        icon={<SecurityScanOutlined />}
        onClick={toggleCamera}
        loading={loading}
        style={{}}
      >
        {isCameraOn ? 'Apagar cámara' : 'Encender cámara'}
      </SaveButton>

      {isCameraOn && (
        <div className="container">
          <img src={img} style={{ width: "100%", height: "70vh", objectFit: "contain"}} />
          <div className="content">
            <video ref={videoRef} className='qr-video' autoPlay playsInline />
            <QrReader
              constraints={{ facingMode: 'environment' }}
              {...rest}
            />
          </div>
        </div>
      )}
      {/* <div className="qr-container">
        {isCameraOn && (
          <div>
            <video className="qr-video" ref={videoRef} autoPlay playsInline />
            <QrReader
              constraints={{ facingMode: 'user' }}
              {...rest}
            />
          </div>
        )}
      </div> */}

    </div>
  );
};

export default QRScan;