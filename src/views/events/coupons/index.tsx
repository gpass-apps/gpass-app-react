import { useMemo, useState } from "react";
import { Button, Col, Row, Upload, message } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { useLocation } from "react-router-dom";
import { QueryConstraint, limit, orderBy, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { initEvent } from "../../../constants";
import HeaderView from "../../../components/headerView";
import Table, { PropsTable } from '../../../components/table';
import { Event, User, Coupon } from "../../../interfaces";
import { RcFile } from "antd/lib/upload";
import { getUsersUploadFromExcel } from "./functions";
import { bulkSetDocuments, add, getCollectionGeneric, bulkAddDocuments } from '../../../services/firebase';
import { useAuth } from "../../../context/authContext";

const Coupons = () => {
  const [triggerReload, setTriggerReload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { userFirestore } = useAuth();
  const location = useLocation();
  const { state } = location;

  const event = useMemo(() => {
    if (state) {
      return state as Event;
    }

    window.location.href = "/eventos";
    return initEvent;
  }, [state]);

  const columns: ColumnsType<Coupon> = useMemo(() => [
    {
      title: 'Número',
      dataIndex: 'number',
      key: 'number',
    },
    { title: 'Empleado (Email)', dataIndex: 'userEmployeeId', key: 'userEmployeeId' },
    { title: 'Escaneado', dataIndex: 'isScanned', key: 'isScanned' },
    {
      title: 'Fecha Creación',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (date) => (date ? dayjs(date.toDate ? date.toDate() : date).format('DD/MM/YYYY hh:mm a') : '')
    }
  ], []);

  const query = useMemo<QueryConstraint[]>(() => {
    if (!event?.id) return [];

    const queryConstraints: QueryConstraint[] = [
      where("eventId", "==", event.id),
      orderBy("number", "asc"),
      limit(20)
    ];

    if (userFirestore?.role === "Embajador") {
      queryConstraints.push(where("userAmbassadorId", "==", userFirestore?.email || ""));
    }

    return queryConstraints;
  }, [event?.id, userFirestore]);

  const propsTable = useMemo<PropsTable<Coupon>>(() => ({
    triggerReload,
    columns,
    placeholderSearch: "Buscar por correo Empleado",
    collection: "Coupons",
    query,
    searchValues: {
      userEmployeeId: "Correo Empleado",
      number: "Número",
      isScanned: "Escaneado"
    },
    disabledFilter: false,
    disableDisabledFilter: true,
    optiosSearchValues: [
      {
        propSearch: "isScanned",
        options: [
          { key: "", label: "Todos" },
          { key: "Si", label: "Si" },
          { key: "No", label: "No" }
        ]
      }
    ]
  }), [columns, query, triggerReload]);

  const getLastCouponNumber = async (eventId: string) => {
    try {
      const queryConstraints: QueryConstraint[] = [
        where("eventId", "==", eventId),
        orderBy("number", "desc"),
        limit(1)
      ];

      const coupons = await getCollectionGeneric<Coupon>("Coupons", queryConstraints);

      return coupons.length ? coupons[0].number : 0;
    } catch (error) {
      console.log(error);
      throw new Error("Error al obtener el último número de cupón.");
    }
  };

  const uploadCoupons = async (file: RcFile) => {
    if (!file) {
      message.error("Error, archivo no encontrado.");
      return;
    }

    setUploading(true);

    try {
      let lastNumber = await getLastCouponNumber(event.id!);
      const usersUpload = await getUsersUploadFromExcel(file, event);

      const users = usersUpload.map((u) => {
        const userCopy = { ...u, id: u.email };
        delete userCopy.numberOfCoupons;
        return userCopy;
      }) as User[];

      await bulkSetDocuments("Users", users);

      const coupons: Coupon[] = [];

      for (const u of usersUpload) {
        for (let i = 1; i <= u.numberOfCoupons!; i++) {
          lastNumber += 1;

          const couponData: Coupon = {
            eventId: event.id!,
            number: lastNumber,
            isScanned: "No",
            isDownloaded: false,
            createAt: new Date(),
            userEmployeeId: u.email,
            userEmployeeName: u.name,

          };

          coupons.push(couponData);
        }
      }

      await bulkAddDocuments("Coupons", coupons);

      message.success("Cupones cargados con éxito!", 5);

      setTriggerReload(true);

      setTimeout(() => {
        setTriggerReload(false);
      }, 0);
    } catch (error) {
      console.error(error);
      message.error(
        error instanceof Error ? error.message : "Error al procesar el excel.",
        5
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: 20 }}>
      <HeaderView
        path="/eventos"
        title={`Cupones ${event.name}`}
        goBack
      />
      <Row
        justify="start"
        gutter={10}
        style={{ marginBottom: 20 }}
      >
        <Col>
          <Button
            icon={<DownloadOutlined />}
            shape="round"
            type="primary"
          >
            Descargar reporte
          </Button>
        </Col>
        <Col>
          <Upload
            beforeUpload={(file) => {
              uploadCoupons(file);
              return false;
            }}
            accept=".xlsx"
            showUploadList={false}
            customRequest={({ onSuccess }) => {
              setTimeout(() => {
                onSuccess!("ok");
              }, 0);
            }}
          >
            <Button
              icon={<UploadOutlined />}
              shape="round"
              type="primary"
              loading={uploading}
            >
              {uploading ? "Cargando cupones..." : "Cargar cupones"}
            </Button>
          </Upload>
        </Col>
      </Row>

      <Table
        {...propsTable}
      />
    </div>
  );
};

export default Coupons;