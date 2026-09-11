import { useMemo, useState } from "react";
import { Button, Col, Row, Upload, message } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { QueryConstraint, Timestamp, limit, orderBy, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { couponReportColumns } from "../../constants";
import HeaderView from "../../components/headerView";
import Table, { PropsTable } from '../../components/table';
import { Coupon, User } from "../../interfaces";
import { RcFile } from "antd/lib/upload";
import { getLastCouponNumberByEventsName, getUsersUploadFromExcel } from "./functions";
import { getCollectionGeneric, bulkAddDocuments } from '../../services/firebase';
import { useAuth } from "../../context/authContext";
import { downloadExcelOneWorkSheet } from "../../utils/functions";
import { post } from "../../services";

const Coupons = () => {
  const [triggerReload, setTriggerReload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { userFirestore } = useAuth();

  const columns: ColumnsType<Coupon> = useMemo(() => [
    {
      title: 'Evento',
      dataIndex: 'eventName',
      key: 'eventName'
    },
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
    const queryConstraints: QueryConstraint[] = [
      orderBy("eventName", "asc"),
      orderBy("number", "asc"),
      limit(20)
    ];

    if (userFirestore?.role === "Embajador") {
      queryConstraints.push(where("userAmbassadorId", "==", userFirestore?.email || ""));
    }

    return queryConstraints;
  }, [userFirestore]);

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

  const downloadCouponsReport = async () => {
    setDownloading(true);

    try {
      const queryConstraints: QueryConstraint[] = [
        orderBy("number", "asc")
      ];

      if (userFirestore?.role === "Embajador") {
        queryConstraints.push(where("userAmbassadorId", "==", userFirestore.email || ""));
      }

      const coupons = await getCollectionGeneric<Coupon>("Coupons", queryConstraints);
      const rows = coupons.map((coupon) => ({
        ...coupon,
        isScanned: coupon.isScanned ? "Si" : "No",
        dateScanned: coupon.dateScanned
          ? dayjs((coupon.dateScanned as Timestamp).toDate()).format("DD/MM/YYYY hh:mm a")
          : "",
        createAt: dayjs((coupon.createAt as Timestamp).toDate()).format("DD/MM/YYYY hh:mm a"),
        isDownloaded: coupon.isDownloaded ? "Si" : "No"
      }));

      await downloadExcelOneWorkSheet("Cupones", couponReportColumns, rows);
    } catch (error) {
      console.error(error);
      message.error("No se pudo descargar el reporte de cupones.", 5);
    } finally {
      setDownloading(false);
    }
  };

  const uploadCoupons = async (file: RcFile) => {
    if (!file) {
      message.error("Error, archivo no encontrado.");
      return;
    }

    setUploading(true);

    try {
      const { lastNumbersByEvent, events } = await getLastCouponNumberByEventsName();

      const usersUpload = await getUsersUploadFromExcel(file, events);

      const users = usersUpload.map((u) => {
        const userCopy = { ...u, id: u.email };
        delete userCopy.numberOfCoupons;

        return userCopy;
      }) as User[];

      await post("/users/createByCoupons", users);

      const coupons: Coupon[] = [];
      const currentNumbersByEvent: Record<string, number> = { ...lastNumbersByEvent };

      for (const u of usersUpload) {
        const eventId = u.eventId || events.find(e => e.name === u.eventName)?.id || "";

        for (let i = 1; i <= u.numberOfCoupons!; i++) {
          const nextNumber = (currentNumbersByEvent[eventId] || 0) + 1;
          currentNumbersByEvent[eventId] = nextNumber;

          const couponData: Coupon = {
            eventId,
            eventName: u.eventName!,
            number: nextNumber,
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
        title={`Cupones`}
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
            onClick={downloadCouponsReport}
            loading={downloading}
          >
            {downloading ? "Descargando cupones" : "Descargar cupones"}
          </Button>
        </Col>
        <Col>
          <Button
            icon={<DownloadOutlined />}
            shape="round"
            type="primary"
            onClick={downloadCouponsReport}
            loading={downloading}
          >
            {downloading ? "Descargando reporte..." : "Descargar reporte"}
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