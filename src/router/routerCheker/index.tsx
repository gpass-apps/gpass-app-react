import { Layout } from 'antd';
import { Suspense, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import MenuComponent from '../../components/menu';
import Breadcrumb from '../../components/breadcrumb';
import FullLoader from "../../components/fullLoader";
import { Rols } from "../../types";
import { privateRoutesByUser } from './../../constants';

const firstRouteByUser: Record<Rols, string> = Object.freeze({
  "SuperAdministrador": "/empresas",
  "Administrador": "/eventos",
  "Embajador": "/eventos",
  "Lector": "/eventos",
  "Empleado": "/eventos"
});

const RoterChecker = () => {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user && pathname !== "/") {
      navigate('/');
      return;
    }

    if (user && !privateRoutesByUser[user?.displayName as Rols].includes(pathname)) {
      navigate(firstRouteByUser[user?.displayName as Rols]);
    }
  }, [user, pathname, navigate, loading]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {user ? <MenuComponent /> : null}
      <Layout.Content style={{ padding: user ? "2vh" : 0 }}>
        {user && <Breadcrumb />}
        <Suspense fallback={<FullLoader />}>
          <Outlet />
        </Suspense>
      </Layout.Content>
    </Layout>
  );
};

export default RoterChecker;