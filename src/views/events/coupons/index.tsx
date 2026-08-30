import { useEffect, useMemo, useState } from "react";
import { Button, Col, Row, Upload } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { initEvent, } from "../../../constants";
import { useLocation } from "react-router-dom";
import HeaderView from "../../../components/headerView";
import { Event, User, UserUpload, Coupon } from "../../../interfaces";
import { getArrayChunk, } from "../../../utils/functions";
import { message } from 'antd';
import { RcFile } from "antd/lib/upload";
import { getUsersUploadFromExcel } from "./functions";
import { bulkSetDocuments } from "../../../services/firebase";
import { add } from '../../../services/firebase';

const Coupons = () => {
  const [uploading, setUploading] = useState(false);
  const location = useLocation();
  const { state } = location;

  const event = useMemo(() => {
    if (state) {
      return state as Event;
    }

    window.location.href = "/eventos";

    return initEvent;
  }, [state]);

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

      for (const u of usersUpload) {
        const numberOfCoupons = hasGlobal
          ? eventCoupons
          : Number(u.numberOfCoupons ?? 0);

        for (let i = 1; i <= numberOfCoupons; i++) {
          const couponData = {
            eventId: event.id!,
            number: i,
            isScanned: "No",
            userAmbassadorId: u.email,
            isDownloaded: false,
            createAt: new Date(),
          };

          await add("Coupons", couponData);
        }
      }

      message.success("Cupones cargados con éxito!", 5);
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
    <div style={{ marginTop: 20 }}>
      <HeaderView
        path="/eventos"
        title={`Cupones ${event.name}`}
        goBack
      />
      <Row
        justify="start"
        gutter={10}
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
    </div>
  );
};

export default Coupons;