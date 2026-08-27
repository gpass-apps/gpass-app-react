import { useMemo, useState } from "react";
import { Button, Col, Row, Upload } from "antd";
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { UploadChangeParam, UploadFile } from "antd/es/upload";
import { initEvent, initUser, mapExcelHeadersCoupons } from "../../../constants";
import { useLocation } from "react-router-dom";
import HeaderView from "../../../components/headerView";
import { Event, User } from "../../../interfaces";
import { getWorkbookFromFile, isObject } from "../../../utils/functions";
import { message } from 'antd';

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

  const uploadCoupons = async (info: UploadChangeParam<UploadFile<any>>) => {
    const file = info.file.originFileObj;

    if (!file) {
      message.error("Error, archivo no encontrado.");
      return;
    }

    setUploading(true);

    try {
      const workbook = await getWorkbookFromFile(file);
      const worksheet = workbook.getWorksheet(1);

      if (!worksheet) {
        message.error("Error, hoja de excel no encontrada");
        return;
      }

      const employees: User[] = [];
      const headers = (worksheet.getRow(1).values as string[]).slice(1).map(h => h.toLocaleLowerCase());
      const userKeys = headers.map(h => mapExcelHeadersCoupons[h]);

      const rows = worksheet.getSheetValues().slice(2).map(row => (row as Array<any>).slice(1));

      console.log(rows);

      for (const row of rows) {
        let user: User = {} as User;

        for (let i = 0; i < userKeys.length; i++) {
          const key = userKeys[i];
          let cellValue = row[i];

          if (typeof cellValue === "undefined" || cellValue === null) {
            cellValue = "";
          }

          if (isObject(cellValue) && "result" in cellValue) {
            cellValue = (cellValue.result as number).toString();
          }

          user = { ...user, [key]: cellValue.toString() };
        }

        employees.push(user);
      }

      console.log(employees);
    } catch (error) {
      console.log(error);
      message.error("Error al procesar el archivo excel.");
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
            onChange={uploadCoupons}
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