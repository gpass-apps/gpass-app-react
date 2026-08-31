import { useEffect, useMemo, useState } from "react";
import { Button, Col, Row, Upload, message } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { useLocation } from "react-router-dom";
import { QueryConstraint, limit, where, orderBy } from 'firebase/firestore';
import dayjs from 'dayjs';

import { initEvent } from "../../../constants";
import HeaderView from "../../../components/headerView";
import Table, { PropsTable } from '../../../components/table';
import { Event, User, Coupon } from "../../../interfaces";
import { RcFile } from "antd/lib/upload";
import { getUsersUploadFromExcel } from "./functions";
import { bulkSetDocuments, add, getCollectionGeneric } from '../../../services/firebase';
import { useAuth } from "../../../context/authContext";

interface CouponTable extends Coupon {
  id?: string;
}

const Coupons = () => {
  const [uploading, setUploading] = useState(false);
  const [loadingTable, setLoadingTable] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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

  const searchVal = useMemo<Record<string, string>>(() => ({
    userAmbassadorId: "Correo Empleado",
    number: "Número",
    isScanned: "Escaneado"
  }), []);

  const columns: ColumnsType<CouponTable> = useMemo(() => [
    { 
      title: 'Número', 
      dataIndex: 'number', 
      key: 'number',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => (a.number ?? 0) - (b.number ?? 0)
    },
    { title: 'Embajador (Email)', dataIndex: 'userAmbassadorId', key: 'userAmbassadorId' },
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
      limit(20)
    ];

    if (userFirestore?.role === "Embajador") {
      queryConstraints.push(where("userAmbassadorId", "==", userFirestore?.email || ""));
    }

    return queryConstraints;
  }, [event?.id, userFirestore]);

  const propsTable = useMemo<PropsTable<CouponTable>>(() => ({
    wait: loadingTable,
    columns,
    placeholderSearch: "Buscar por correo Empleado",
    collection: "Coupons",
    query,
    searchValues: searchVal,
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
  }), [columns, query, loadingTable, searchVal, refreshKey]);

 const getLastCouponNumber = async (eventId: string): Promise<number> => {
  try {
    const queryConstraints: QueryConstraint[] = [
      where("eventId", "==", eventId)
    ];

    const coupons = await getCollectionGeneric<CouponTable>("Coupons", queryConstraints);

    if (coupons.length > 0) {
      const maxNumber = Math.max(...coupons.map((c) => Number(c.number || 0)));
      return maxNumber;
    }

    return 0;
  } catch (error) {
    console.error("Error al obtener el número de cupones:", error);
    return 0;
  }
};

  const uploadCoupons = async (file: RcFile) => {
    if (!file) {
      message.error("Error, archivo no encontrado.");
      return;
    }

    setUploading(true);

    try {
      const usersUpload = await getUsersUploadFromExcel(file, event);

      const eventCoupons = Number(event?.couponsByEmployee ?? 0);
      const hasGlobal = eventCoupons > 0;

      for (const u of usersUpload) {
        const individualCoupons = Number(u.numberOfCoupons ?? 0);

        if (!hasGlobal && individualCoupons <= 0) {
          message.error(
            "Favor de llenar las celdas de cantidad de cupones",
            5
          );
          return;
        }
      }

      const users = usersUpload.map((u) => {
        const userCopy = { ...u, id: u.email };
        delete userCopy.numberOfCoupons;
        return userCopy;
      }) as User[];

      await bulkSetDocuments("Users", users);

      let currentNumber = await getLastCouponNumber(event.id!);

      for (const u of usersUpload) {
        const numberOfCoupons = hasGlobal
          ? eventCoupons
          : Number(u.numberOfCoupons ?? 0);

        for (let i = 1; i <= numberOfCoupons; i++) {
          currentNumber += 1;

          const couponData = {
            eventId: event.id!,
            number: currentNumber,
            isScanned: "No",
            userAmbassadorId: u.email,
            isDownloaded: false,
            disabled: false,
            createAt: new Date(),
          };

          await add("Coupons", couponData);
        }
      }

      message.success("Cupones cargados con éxito!", 5);
      setRefreshKey((prev) => prev + 1);
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
        key={refreshKey}
        {...propsTable}
      />
    </div>
  );
};

export default Coupons;