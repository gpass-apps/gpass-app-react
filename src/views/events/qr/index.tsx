import HeaderView from '../../../components/headerView';
import { useState } from 'react';
import { Alert, Button, message, Modal, Space, Spin } from 'antd';
import { useLocation } from 'react-router-dom';
import { Ticket, Coupon, Event } from '../../../interfaces';
import {
  update,
  getCollectionGeneric,
  getGenericDocById
} from '../../../services/firebase';
import { Timestamp, where } from 'firebase/firestore';
import { useAuth } from "../../../context/authContext";
import QRScan from "../../../components/QRScan";
import { OnResultFunction } from 'react-qr-reader';
import { urlImageDefaultEvent} from "../../../constants";

interface AlertProps {
  message: string;
  description: string;
  type?: "success" | "info" | "error" | "warning";
}

const Qr = () => {
  const { user, userFirestore } = useAuth();

  const location = useLocation();
  const { state } = location;

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalData, setModalData] = useState<AlertProps>({
    message: "",
    description: "",
    type: undefined
  });

  const [scanActive, setScanActive] = useState(true);

  const [event, setEvent] = useState<Event | null>(
    state ? state as Event : null
  );

  const handleScanResult: OnResultFunction = async (result) => {
    if (!result) return;

    setScanActive(false);

    try {
      const qrText = result.getText();

      console.log("QR leído:", qrText);


      const separatorIndex = qrText.indexOf("-");

      if (separatorIndex === -1) {
        setModalData({
          message: "QR no válido.",
          description: "El código QR no tiene un formato válido.",
          type: "error"
        });

        setIsModalOpen(true);
        return;
      }

      const eventId = qrText.substring(0, separatorIndex);
      const numberTicket = qrText.substring(separatorIndex + 1);

      if (!eventId || !numberTicket || isNaN(Number(numberTicket))) {
        setModalData({
          message: "QR no válido.",
          description: "No se pudo obtener correctamente el evento o número del boleto.",
          type: "error"
        });

        setIsModalOpen(true);
        return;
      }

      console.log("Event ID obtenido del QR:", eventId);
      console.log("Número obtenido del QR:", numberTicket);

      const responseEvent = await getGenericDocById<Event>(
        'Events',
        eventId
      );

      if (!responseEvent) {
        setModalData({
          message: "Evento no encontrado.",
          description: "El evento asociado al código QR no existe.",
          type: "error"
        });

        setIsModalOpen(true);
        return;
      }

      setEvent(responseEvent);


      if (state) {
        const selectedEvent = state as Event;

        /*
         * Si tu objeto Event tiene id:
         */
        if (selectedEvent.id && selectedEvent.id !== eventId) {
          setModalData({
            message: "El QR pertenece a otro evento.",
            description: "Favor de escanear un boleto o cupón correspondiente al evento seleccionado.",
            type: "error"
          });

          setIsModalOpen(true);
          return;
        }
      }

      if (responseEvent.disabled) {
        setModalData({
          message: "Este evento no se encuentra disponible.",
          description: "",
          type: "error"
        });

        setIsModalOpen(true);
        return;
      }

      const finalDate = responseEvent.finalDate as any as Timestamp;

      if (finalDate.toDate() < new Date()) {
        setModalData({
          message: "Este evento se encuentra vencido.",
          description: "Favor de intentar con otro boleto o cupón válido.",
          type: "error"
        });

        setIsModalOpen(true);
        return;
      }

      const tickets = await getCollectionGeneric<Ticket>(
        'Tickets',
        [
          where('eventId', '==', eventId),
          where('number', '==', Number(numberTicket))
        ]
      );

      if (tickets.length > 0) {

        if (tickets[0].isScanned === "Si") {
          setModalData({
            message: "Este QR ya está escaneado.",
            description: "Favor de intentar con otro boleto válido.",
            type: "error"
          });

          setIsModalOpen(true);
          return;
        }

        await update(
          'Tickets',
          tickets[0].id!,
          {
            userScannerId: user?.uid,
            userScannerName: userFirestore?.name,
            isScanned: "Si",
            dateScanned: new Date()
          }
        );

        setModalData({
          message: responseEvent.textExchange !== ""
            ? `${responseEvent.textExchange}. QR número ${numberTicket} del evento.`
            : `Listo, ya puedes otorgar la Pizza del QR número ${numberTicket} del evento.`,
          description: "Gracias por su apoyo.",
          type: "success"
        });

        setIsModalOpen(true);
        return;
      }

      const coupons = await getCollectionGeneric<Coupon>(
        'Coupons',
        [
          where('eventId', '==', eventId),
          where('number', '==', Number(numberTicket))
        ]
      );

      if (coupons.length > 0) {

        if (coupons[0].isScanned === "Si") {
          setModalData({
            message: "Este QR ya está escaneado.",
            description: "Favor de intentar con otro cupón válido.",
            type: "error"
          });

          setIsModalOpen(true);
          return;
        }

        await update(
          'Coupons',
          coupons[0].id!,
          {
            userEmployeeId: user?.uid,
            userEmployeeName: userFirestore?.name,
            isScanned: "Si",
            dateScanned: new Date()
          }
        );

        setModalData({
          message: responseEvent.textExchange !== ""
            ? `${responseEvent.textExchange}. QR número ${numberTicket} del evento.`
            : `Listo, ya puedes otorgar la Pizza del QR número ${numberTicket} del evento.`,
          description: "Gracias por su apoyo.",
          type: "success"
        });

        setIsModalOpen(true);
        return;
      }

      setModalData({
        message: "QR no válido.",
        description: "No se encontró ningún boleto o cupón válido para este evento.",
        type: "error"
      });

      setIsModalOpen(true);

    } catch (error) {
      console.error(error);

      setModalData({
        message: "Error al procesar QR.",
        description: "No fue posible procesar el código QR.",
        type: "error"
      });

      setIsModalOpen(true);

      message.error('Error al procesar QR.', 4);

    } finally {
      //
    }
  };

  return (
    <div style={{ margin: 20 }}>

      <HeaderView
        path="/eventos"
        goBack
        title={
          event
            ? "Lector de Boletos - " + event.name
            : "Lector de Boletos"
        }
      />

      {scanActive ? (
        <QRScan
          offCamera={!isModalOpen}
          img={event?.image as string || urlImageDefaultEvent}
          scanDelay={8000}
          onResult={handleScanResult}
          constraints={{ facingMode: 'environment' }}
        />
      ) : (
        <Spin />
      )}

      <Modal
        title=""
        open={isModalOpen}
        footer={null}
      >
        <Space
          direction="vertical"
          style={{ width: '100%' }}
        >
          <Alert
            message={modalData.message}
            description={modalData.description}
            type={modalData.type}
            showIcon
          />

          <div
            style={{
              textAlign: 'center',
              marginTop: '20px'
            }}
          >
            <Button
              type="primary"
              onClick={() => {
                setScanActive(true);
                setIsModalOpen(false);
              }}
            >
              Listo
            </Button>
          </div>
        </Space>
      </Modal>

    </div>
  );
};

export default Qr;
