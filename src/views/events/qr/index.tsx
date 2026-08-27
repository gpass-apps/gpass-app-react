import HeaderView from '../../../components/headerView';
import { useState, useMemo } from 'react';
import { Alert, Button, message, Modal, Space } from 'antd'
import { useLocation } from 'react-router-dom';
import { Ticket, Event } from '../../../interfaces';
import { initEvent } from '../../../constants';
import { update, getCollectionGeneric, getGenericDocById } from '../../../services/firebase';
import { Timestamp, where } from 'firebase/firestore';
import { useAuth } from "../../../context/authContext";
import QRScan from "../../../components/QRScan";
import { Spin } from 'antd';
import { OnResultFunction } from 'react-qr-reader';

interface AlertProps {
  message: string;
  description: string;
  type?: "success" | "info" | "error" | "warning" | undefined;
}

const Qr = () => {
  const { user, userFirestore } = useAuth();
  const location = useLocation();
  const { state } = location;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setIsModalData] = useState<AlertProps>({
    message: "",
    description: "",
    type: undefined
  });
  const [scanActive, setScanActive] = useState(true);

  const event = useMemo(() => {
    if (state) {
      return state as Event;
    }

    window.location.href = "/eventos";

    return initEvent;
  }, [state]);


  const handleScanResult: OnResultFunction = async (result) => {
    if (!result) return
    setScanActive(false)
    try {
      const [eventId, numberTicket] = result.getText().split("-");
      const responseEvent = await getGenericDocById<Event>('Events', eventId)
      const tickets = await getCollectionGeneric<Ticket>('Tickets', [where('eventId', '==', eventId), where('number', '==', + numberTicket)])
      const finalDate = responseEvent.finalDate as any as Timestamp;

      // if (eventId !== event.id) {
      //   setIsModalData({
      //     message: `Este boleto no coincide con el evento - ${event?.name.toUpperCase()}`,
      //     description: "favor de seleccionar un boleto correspondiente al evento.",
      //     type: "error"
      //   })

      //   return
      // }

      if (responseEvent.disabled) {
        setIsModalData({
          message: `Este evento no se encuentra disponible.`,
          description: "",
          type: "error"
        })

        return
      }

      if (finalDate.toDate() < new Date()) {
        setIsModalData({
          message: `Este evento se encuentra vencido.`,
          description: "favor de intentar con otro boleto válido",
          type: "error"
        })

        return
      }

      if (tickets[0].isScanned === "Si") {
        setIsModalData({
          message: `Este QR ya esta escaneado.`,
          description: "favor de intentar con otro boleto válido",
          type: "error"
        })

        return
      }

      await update('Tickets', tickets[0].id!, { userScannerId: user?.uid, userScannerName: userFirestore?.name, isScanned: "Si", dateScanned: new Date() })
      setIsModalData({
        message: responseEvent?.textExchange !== "" ? `${responseEvent?.textExchange}. QR numero ${numberTicket} del evento.` : `Listo ya puedes otorgar la Pizza del QR numero ${numberTicket} del evento.`,
        description: "Gracias por su apoyo.",
        type: "success"
      })
    } catch (error) {
      message.error('Error al procesar QR.', 4);
    } finally {
      setIsModalOpen(true)

    }
  };

  return (
    <div style={{ margin: 20 }}>
      <HeaderView
        path="/eventos"
        goBack
        title={"Lector de Boletos - " + event?.name}
      />
      {/* <QrCode /> */}
      {scanActive ? (
        <QRScan
          offCamera={!isModalOpen}
          img={event?.image as string}
          scanDelay={8000}
          onResult={handleScanResult}
          constraints={{ facingMode: 'environment' }}
        />
      ) : (
        <Spin />
      )}

      <Modal title="" open={isModalOpen} footer={null}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message={modalData.message}
            description={modalData.description}
            type={modalData.type}
            showIcon
          />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Button type="primary" onClick={() => { setScanActive(true); setIsModalOpen(false); }}>Listo</Button>
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default Qr;