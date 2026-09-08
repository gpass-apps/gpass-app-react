import { CSSProperties } from "react";
import { CalendarOutlined, SettingOutlined, ShopOutlined, LogoutOutlined, UserOutlined, TagsFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { message } from "antd";
import { getAuth } from "firebase/auth";


const styleIcon: CSSProperties = {
  fontSize: 20
};

const menuItems = [
  {
    key: '/empresas',
    title: '',
    label: <Link to="/empresas">Empresas</Link>,
    icon: <ShopOutlined style={styleIcon} />
  },
  {
    key: '/eventos',
    title: '',
    label: <Link to="/eventos">Eventos</Link>,
    icon: <CalendarOutlined style={styleIcon} />
  },
  {
    key: '/usuarios',
    title: '',
    label: <Link to="/usuarios">Usuarios</Link>,
    icon: <UserOutlined style={styleIcon} />
  },
  {
    key: '/cupones',
    title: '',
    label: <Link to="/cupones">Cupones</Link>,
    icon: <TagsFilled style={styleIcon} />
  },
  {
    key: '/configuracion',
    title: '',
    icon: <SettingOutlined style={styleIcon} />,
    label: 'Configuración',
    children: [
      /*  {
         key: '/configuracion/perfil',
         title: '',
         icon: <AuditOutlined style={styleIcon} />,
         label: <Link to="/configuracion/perfil">Perfil</Link>,
       }, */
      {
        key: '/signOut',
        title: '',
        icon: <LogoutOutlined style={styleIcon} />,
        label: 'Cerrar sesión',
        onClick: async () => {
          try {
            await getAuth().signOut();
          } catch (error) {
            console.log(error);
            message.error("Error al cerrar sesión.", 4);
          }
        }
      }
    ]
  }
];

export default menuItems;
