import { useEffect, useMemo, useState } from "react";
import { Button, Col, Row, Upload } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { initEvent, } from "../../../constants";
import { useLocation } from "react-router-dom";
import HeaderView from "../../../components/headerView";
import { Event, User, UserUpload } from "../../../interfaces";
import { getArrayChunk, } from "../../../utils/functions";
import { message } from 'antd';
import { RcFile } from "antd/lib/upload";
import { getUsersUploadFromExcel } from "./functions";
import { bulkSetDocuments } from "../../../services/firebase";

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
      const users = usersUpload.map(u => {
        delete u.numberOfCoupons;

        u.id = u.email;
        return u;
      }) as User[];

      console.log(users);
      await bulkSetDocuments("Users", users);

      message.success("Cupones cargados con exito!", 5);
    } catch (error) {
      console.error(error);
      message.error(error instanceof Error ? error.message : "Error al procesar el excel.", 5);
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