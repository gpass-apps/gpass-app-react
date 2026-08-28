import { useEffect, useMemo, useState } from "react";
import { QueryConstraint, limit, orderBy, where } from "firebase/firestore";
import HeaderView from "../../../components/headerView";
import Table, { PropsTable } from "../../../components/table";
import { ColumnsType } from "antd/es/table";
import { Event, Ticket, User } from "../../../interfaces";
import { useLocation } from "react-router-dom";
import dayjs from "dayjs";
import { QRCodeCanvas } from "qrcode.react";
import useCollection, { PropsUseCollection } from "../../../hooks/useCollection";
import { Form } from "antd";
import { useAuth } from "../../../context/authContext";

interface TicketTable extends Ticket {
  ticketUrl?: string;
}

const Tickets = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { state } = location;
  const propsUseCollection = useMemo<PropsUseCollection>(() => ({
    collection: "Users",
    query: [where("role", "in", ["Embajador", "Lector"])]
  }), []);
  const { loading, data: users } = useCollection<User>(propsUseCollection);
  const [tickets, setTickets] = useState<TicketTable[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!tickets.length) return;

    const values: Record<string, string | undefined> = {};

    tickets.forEach((ticket) => {
      values[`userAmbassadorId-${ticket.number}`] = ticket.userAmbassadorId;
    });

    form.setFieldsValue(values);
  }, [form, tickets]);

  const event = useMemo(() => {
    if (state) {
      return state as Event;
    }

    window.location.href = "/eventos";

    return undefined;
  }, [state]);

  const columns = useMemo<ColumnsType<TicketTable>>(() => [
    { title: 'Numero', dataIndex: 'number', key: 'number' },
    { title: 'Escaneado', dataIndex: 'isScanned', key: 'isScanned' },
    { title: 'Usuario escaner', dataIndex: 'userScannerName', key: 'userScannerName' },
    {
      title: "Fecha escaneado",
      dataIndex: "dateScanned",
      key: "dateScanned",
      render: (_, ticket) => (ticket.dateScanned ? dayjs(ticket.dateScanned).format("DD/MM/YYYY hh:mm a") : "")
    },
    {
      title: "Embajador",
      dataIndex: "userAmbassadorName",
      key: "userAmbassadorName",
      render: (_, ticket) => ticket.userAmbassadorName
    },
    {
      title: "",
      dataIndex: "qr",
      key: "qr",
      render: (_, ticket) => (
        <QRCodeCanvas value={`${event?.id}-${ticket.number}`} id={ticket.number.toString()} style={{ display: "none" }} />
      )
    }
  ], [event, users]);

  const query = useMemo<QueryConstraint[]>(() => {
    const query = [where("eventId", "==", event?.id || ""), orderBy("number"), limit(20)];

    if (user?.displayName === "Lector") {
      query.push(where("userScannerId", "==", user.uid || ""));
    }

    if (user?.displayName === "Embajador") {
      query.push(where("userAmbassadorId", "==", user.uid || ""));
    }

    return query;
  }, [event, user]);

  const propsTable = useMemo<PropsTable<TicketTable>>(() => ({
    wait: loading,
    columns: columns,
    placeholderSearch: "Buscar por nombre embajador / lector,numero...",
    collection: "Tickets",
    query,
    formatDate: "DD/MM/YYYY hh:mm a",
    searchValues: {
      userAmbassadorName: "Nombre Embajador",
      userScannerName: "Nombre lector",
      number: "Número",
      isScanned: "Escanedo",
      dateScanned: "Fecha escaneado",
    },
    optiosSearchValues: [
      {
        propSearch: "isScanned",
        options: [
          {
            key: "",
            label: "Sin filtro"
          },
          {
            key: "Si",
            label: "Si"
          },
          {
            key: "No",
            label: "No"
          }
        ]
      }
    ],
    removeTableActions: true,
    downloadPdf: true,
    imageEventUrl: event?.image as string,
    onLoadData: setTickets
  }), [event, columns, loading, query]);

  return (
    <div style={{ margin: 20 }}>
      <HeaderView
        path="/eventos"
        title={`Tickets ${event?.name}`}
        goBack
      />
      <Table {...propsTable} />
    </div>
  );
};

export default Tickets;