import { ReactNode, useState } from 'react';
import { Layout, Menu, Modal } from 'antd';
import logo from '../../assets/logo-hmo2.png';
import { IdcardOutlined, UserOutlined } from '@ant-design/icons';
import Login from "./login";
import SingUp from "./singUp";
import { MenuItemType } from "antd/es/menu/interface";

const { Header } = Layout;

const HeaderComponent = () => {
  const [openLogin, setOpenLogin] = useState(false);
  const [openSingUp, setOpenSingUp] = useState(false);

  const menuItems: MenuItemType[] = [
    {
      key: '0',
      icon: <UserOutlined />,
      label: 'Iniciar sesión',
      onClick: () => setOpenLogin(true)
    },
    {
      key: '1',
      icon: <IdcardOutlined />,
      label: 'Registrar empresa',
      onClick: () => setOpenSingUp(true)
    }
  ];

  return (
    <>
      <Header>
        <div className="logo">
          <img src={logo} alt="logo" width="150px" height="45px" />
        </div>
        <Menu
          className='customclass'
          style={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}
          mode="horizontal"
          items={menuItems}
        />
      </Header>
      <Modal
        open={openLogin}
        onCancel={() => setOpenLogin(false)}
        footer={null}
      >
        <Login open={openLogin} />
      </Modal>
      <Modal
        open={openSingUp}
        onCancel={() => setOpenSingUp(false)}
        footer={null}
      >
        <SingUp />
      </Modal>
    </>
  );
};

export default HeaderComponent;
