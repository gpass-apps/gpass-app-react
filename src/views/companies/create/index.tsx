import { useEffect, useState } from 'react'
import DynamicForm from '../../../components/dynamicForm'
import { Card, Form, message, UploadFile } from 'antd'
import { add, update } from '../../../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { initCompany, titleForm } from '../../../constants';
import { Company } from '../../../interfaces';
import { TypeRute } from '../../../types';
import HeaderView from "../../../components/headerView";
import { setImagesToState } from "../../../utils/functions";

const collection = "Companies";

const CreateCompany = () => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [type, setType] = useState<TypeRute>("create");
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company>(initCompany)

  useEffect(() => {
    let _company = { ...state } as Company | null;
    setType(_company?.id ? "update" : "create");
    if (!_company?.id) return;
    _company = setImagesToState(_company);
    setCompany(_company);
  }, [state, form])

  const onFinish = async () => {
    if (saving) return;
    const _company = { ...company };
    setSaving(true);
    try {
      if (type === "update") {
        const id = _company.id!;
        delete _company.id;
        await update(collection, id, _company)
      } else {
        await add(collection, _company)
      }
      message.success('Empresa guardada con éxito.', 4);
      navigate('/empresas')
    } finally {
      setSaving(false)
    }
  }

  console.log(company)

  return (
    <div>
      <HeaderView
        title={titleForm[type]}
        path="/empresas"
        goBack
      />
      <Card>
        <DynamicForm
          initialValues={company}
          form={form}
          layout='vertical'
          loading={saving}
          onFinish={onFinish}
          justify="center"
          inputs={[
            {
              typeControl: 'input',
              typeInput: 'text',
              label: 'Nombre',
              name: 'name',
              rules: [{ required: true, message: 'Favor de escribir el nombre de la empresa.' }],
              value: company.name,
              onChange: (value: string) => setCompany({ ...company, name: value }),
              md: 8
            },
            {
              typeControl: 'input',
              typeInput: 'email',
              label: 'Correo',
              name: 'email',
              value: company.email,
              onChange: (value: string) => setCompany({ ...company, email: value }),
              md: 8
            },
            {
              typeControl: 'phone',
              label: 'Teléfono',
              required: true,
              rules: [{ required: true, message: 'Favor de escribir el telefono de la empresa.' }],
              name: 'phone',
              value: company.phone,
              onChange: (value: string) => setCompany({ ...company, phone: value }),
              md: 8
            },
            {
              typeControl: "file",
              name: "image",
              value: company.image,
              maxCount: 1,
              accept: "image/png, image/jpeg",
              onChange: (value: UploadFile<any>[]) => setCompany({ ...company, image: value }),
              md: 8,
              styleFI: { display: "flex", justifyContent: "center" },
              multiple: false,
            },
            {
              typeControl: 'textarea',
              typeInput: 'text',
              label: 'Descripción',
              name: 'address',
              rules: [{ required: true, message: 'Favor de escribir la direccion de la empresa.' }],
              value: company.address,
              onChange: (value: string) => setCompany({ ...company, address: value }),
              md: 24
            }
          ]}
        />
      </Card>
    </div>
  )
}

export default CreateCompany;