import { useMemo, useState } from "react";
import { Button, Col, Row, Upload, message } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { useLocation } from "react-router-dom";
import { QueryConstraint, Timestamp, limit, orderBy, where } from 'firebase/firestore';
import dayjs from 'dayjs';
import { couponReportColumns, initEvent } from "../../../constants";
import HeaderView from "../../../components/headerView";
import Table, { PropsTable } from '../../../components/table';
import { Event, User, Coupon } from "../../../interfaces";
import { RcFile } from "antd/lib/upload";
import { getLastCouponNumber, getUsersUploadFromExcel } from "./functions";
import { getCollectionGeneric, bulkAddDocuments, bulkSetDocuments } from '../../../services/firebase';
import { downloadExcelOneWorkSheet } from "../../../utils/functions";
import { post } from "../../../services";
import { QRCodeCanvas } from "qrcode.react";
import QRCode from "qrcode";
import { Document, Page, Image, StyleSheet, pdf } from '@react-pdf/renderer';

const stylesPDF = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  qrImage: {
    position: 'absolute',
    top: '45%',
    left: '48%',
    transform: 'translate(-50%, -50%)',
    width: 120,
    height: 120,
  },
});

const Coupons = () => {
  const [triggerReload, setTriggerReload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [query, setQuery] = useState<QueryConstraint[]>([]);
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
    { title: 'Sucursal', dataIndex: 'branch', key: 'branch' },
    { title: 'Estado', dataIndex: 'state', key: 'state' },
    { title: 'Escaneado', dataIndex: 'isScanned', key: 'isScanned' },
    {
      title: 'Fecha Creación',
      dataIndex: 'createAt',
      key: 'createAt',
      render: (date) => (date ? dayjs(date.toDate ? date.toDate() : date).format('DD/MM/YYYY hh:mm a') : '')
    },
    {
      title: "",
      dataIndex: "qr",
      key: "qr",
      render: (_, coupon) => (
        <QRCodeCanvas
          value={`${event?.id}-${coupon.number}`}
          id={coupon.number.toString()}
          style={{ display: "none" }}
        />
      )
    }
  ], [event]);

  const queryBase = useMemo<QueryConstraint[]>(() => {
    if (!event?.id) return [];

    const queryConstraints: QueryConstraint[] = [
      where("eventId", "==", event.id),
      orderBy("number", "asc"),
      limit(20)
    ];

    return queryConstraints;
  }, [event?.id]);

  const propsTable = useMemo<PropsTable<Coupon>>(() => ({
    triggerReload,
    columns,
    placeholderSearch: "Buscar",
    collection: "Coupons",
    query: queryBase,
    searchValues: {
      userEmployeeId: "Correo Empleado",
      number: "Número",
      isScanned: "Escaneado",
      branch: "Sucursal",
      state: "Estado",
    },
    disabledFilter: false,
    disableDisabledFilter: true,
    downloadPdfCoupons: true,
    imageEventUrl: event?.image as string,
    optiosSearchValues: [
      {
        propSearch: "isScanned",
        options: [
          { key: "", label: "Todos" },
          { key: "Si", label: "Si" },
          { key: "No", label: "No" }
        ]
      }
    ],
    onChangeQuery: setQuery,
  }), [columns, queryBase, triggerReload, event.image]);

  const downloadCouponsPDF = async () => {
    setDownloadingPdf(true);

    try {
      const coupons = await getCollectionGeneric<Coupon>("Coupons", query);

      if (!coupons.length) {
        message.info("No hay cupones para descargar.");
        setDownloadingPdf(false);
        return;
      }

      for (const coupon of coupons) {
        const qrUrl = await QRCode.toDataURL(`${event?.id}-${coupon.number}`, { width: 400, margin: 1 });

        const blob = await pdf(
          <Document>
            <Page
              key={coupon.id || coupon.number}
              size={{ width: 440, height: 800 }}
              style={stylesPDF.page}
            >
              {typeof event?.image === "string" && (
                <Image
                  src={event.image}
                  style={stylesPDF.backgroundImage}
                />
              )}
              <Image
                src={qrUrl}
                style={stylesPDF.qrImage}
              />
            </Page>
          </Document>
        ).toBlob();

        const formattedDate = dayjs().format('DD-MM-YYYY-HH-mm-ss');
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${coupon?.userEmployeeId || ""}_Cupon-${coupon.number}_${formattedDate}.pdf`;
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }

      const couponsToUpdate = coupons
        .filter((c) => c.id && !c.isDownloaded)
        .map((c) => ({ id: c.id, isDownloaded: true }));

      if (couponsToUpdate.length) {
        await bulkSetDocuments("Coupons", couponsToUpdate);
      }

      setTriggerReload(true);
      setTimeout(() => {
        setTriggerReload(false);
      }, 0);

      message.success("PDFs de cupones descargados con éxito!", 5);
    } catch (error) {
      console.error(error);
      message.error("Error al descargar PDF de cupones.", 5);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const downloadCouponsReport = async () => {
    setDownloading(true);

    try {
      const queryConstraints: QueryConstraint[] = [
        where("eventId", "==", event.id),
        orderBy("number", "asc")
      ];

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
      let lastNumber = await getLastCouponNumber(event.id!);
      const usersUpload = await getUsersUploadFromExcel(file, event);

      const users = usersUpload.map((u) => {
        const userCopy = { ...u, id: u.email };
        delete userCopy.numberOfCoupons;
        return userCopy;
      }) as User[];

      await post("/users/createByCoupons", users.map(u => ({ ...u, eventId: event.id })));

      const coupons: Coupon[] = [];

      for (const u of usersUpload) {
        for (let i = 1; i <= u.numberOfCoupons!; i++) {
          lastNumber += 1;

          const couponData: Coupon = {
            eventId: event.id!,
            eventName: event!.name,
            number: lastNumber,
            isScanned: "No",
            isDownloaded: false,
            createAt: new Date(),
            userEmployeeId: u.email,
            userEmployeeName: u.name,
            branch: u.branch,
            state: u.state,
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
            onClick={downloadCouponsReport}
            loading={downloading}
          >
            {downloading ? "Descargando reporte..." : "Descargar reporte"}
          </Button>
        </Col>
        <Col>
          <Button
            icon={<DownloadOutlined />}
            shape="round"
            type="primary"
            onClick={downloadCouponsPDF}
            loading={downloadingPdf}
          >
            {downloadingPdf ? "Descargando PDF..." : "Descargar PDF cupones"}
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