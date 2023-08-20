import { FC } from 'react';
import { Col, Row } from 'antd';
import { useNavigate } from 'react-router-dom';
import CreateButton from '../registerButton';
import BackButton from '../backButton';

interface Props {
  title: string;
  path?: string;
  goBack?: boolean;
}

const textButtonsCreate: Record<string, string> = {
  "Usuarios": "usuario",
  "Empresas": "empresa",
} as const;

const HeaderView: FC<Props> = ({ title, path, goBack }) => {
  const navigate = useNavigate();

  return (
    <>
      <Row justify='space-between' align="middle">
        <Col>
          <h1>
            {title}
          </h1>
        </Col>
        {
          path && <Col>
            {
              goBack
                ? <BackButton onClick={() => navigate(path)} />
                : <CreateButton onClick={() => navigate(path)}>
                  {"Registrar " + textButtonsCreate[title]}
                </CreateButton>
            }
          </Col>
        }
      </Row>
      <br />
    </>
  )
}

export default HeaderView;