import { useEffect, useMemo, useState } from 'react'
import DynamicForm from '../../../components/dynamicForm'
import { Card, Form, UploadFile, message } from 'antd'
import { add, update, getCollectionGeneric } from '../../../services/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { initEventForm, titleForm } from '../../../constants';
import { EventForm, Event, Ticket, Company, Option, CustomInput } from '../../../interfaces';
import { TypeRute } from '../../../types';
import HeaderView from "../../../components/headerView";
import dayjs, { Dayjs } from 'dayjs';
import { getArrayChunk, setImagesToState, sleep } from "../../../utils/functions";
import { collection, doc, where, writeBatch } from 'firebase/firestore';
import { db } from "../../../firebaseConfig";
import { useAuth } from '../../../context/authContext';

const collectionName = "Events";

const CreateEvent = () => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const [type, setType] = useState<TypeRute>("create");
  const [saving, setSaving] = useState(false);
  const [event, setEvent] = useState<EventForm>(initEventForm);
  const [totalTicketsSaved, setTotalTicketsSaved] = useState(0);
  const [initTotalTickets, setInitTotalTickets] = useState(0);
  const [companies, setCompanies] = useState<Option[]>();


  useEffect(() => {
    const init = async () => {
      const response = await getCollectionGeneric<Company>('Companies', [where("disabled", "==", false)])
      const selectComapanies = response.map((company) => {
        return {
          value: company.name + "-" + company.id,
          text: company.name
        }
      })
      setCompanies(selectComapanies as Option[]);
    }

    init();
  }, [])

  useEffect(() => {
    let _event = { ...state } as EventForm | null;

    setType(_event?.id ? "update" : "create");

    if (!_event?.id) return;

    _event = setImagesToState(_event);

    setEvent({ ..._event!, initialDate: dayjs(_event!.initialDate), finalDate: dayjs(_event!.finalDate) });
    setInitTotalTickets(_event!.total!);
  }, [state, form])

  const onFinish = async () => {
    if (saving) return;

    try {
      setSaving(true);
      const dataUser = await getCollectionGeneric<EventForm>("Users", [where("email", "==", user?.email)])
      const duplicateData = await getCollectionGeneric<EventForm>(collectionName, [where("name", "==", event.name)])

      if (duplicateData.length && (!event.id || (event.id && event.id !== duplicateData[0].id))) {
        message.error('Este evento ya esta registrado.', 4);
        return;
      }

      const initialDate = event.initialDate.set('hour', 0).set('minute', 0).set('second', 0).toDate();
      const finalDate = event.finalDate.set('hour', 23).set('minute', 59).set('second', 59).toDate();

      const _event = {
        ...event,
        initialDate,
        finalDate,
        companyName: user?.displayName !== "SuperAdministrador" ? dataUser[0]?.companyName : event.companyName,
        companyUid: user?.displayName !== "SuperAdministrador" ? dataUser[0]?.companyUid : event.companyUid
      };

      if (type === "update") {
        const id = _event.id!;

        delete _event.id;
        await update(collectionName, id, _event);

        if (_event.total! > initTotalTickets) {
          setTotalTicketsSaved(initTotalTickets);

          const totalNewTickets = _event.total! - initTotalTickets;
          const tickets = Array.from({ length: totalNewTickets }).map((_, index) => ({ number: index + 1 + initTotalTickets, eventId: id, userScannerId: "", userScannerName: "", isScanned: "No", isDownloaded: false, createAt: new Date() })) as Ticket[];

          await saveTickets(tickets);
        }
      } else {
        const newEvent = await add<Event>(collectionName, { ..._event, ambassadorsRanges: [], userAmbassadorIds: [] });
        const tickets = Array.from({ length: newEvent.total! }).map((_, index) => ({ number: index + 1, eventId: newEvent.id, userScannerId: "", userScannerName: "", isScanned: "No", isDownloaded: false, createAt: new Date() })) as Ticket[];

        await saveTickets(tickets);
      }

      message.success('Evento guardado con éxito.', 4);
      navigate('/eventos')
    } finally {
      setSaving(false)
    }
  }

  const saveTickets = async (tickets: Ticket[]) => {
    try {
      const ticketsChunk = getArrayChunk(tickets, 500);

      for (let i = 0; i < ticketsChunk.length; i++) {
        if (i > 0 && i % 20 === 0) {
          await sleep(80000);
        }

        const batch = writeBatch(db);
        const _tickets = ticketsChunk[i];

        for (let j = 0; j < _tickets.length; j++) {
          const ticket = _tickets[j];

          batch.set(doc(collection(db, "Tickets")), ticket);
        }

        await batch.commit();

        setTotalTicketsSaved(prev => prev + _tickets.length);
      }
    } catch (error) {
      throw error;
    }
  }

  const inputs = useMemo(() => {
    const inputs: CustomInput[] = [
      {
        typeControl: 'input',
        typeInput: 'text',
        label: 'Nombre',
        name: 'name',
        rules: [{ required: true, message: 'Favor de escribir el nombre del evento.' }],
        value: event.name,
        onChange: (value: string) => setEvent(e => ({ ...e, name: value })),
        md: 6
      },
      {
        typeControl: 'date',
        label: 'Fecha Inicial',
        name: 'initialDate',
        disabledDate: date => date > event.finalDate,
        rules: [{ required: true, message: 'Favor de seleccionar la fecha inicial.' }],
        value: event.initialDate,
        onChange: (value: Dayjs) => setEvent(e => ({ ...e, initialDate: value })),
        md: 6
      },
      {
        typeControl: 'date',
        label: 'Fecha Final',
        name: 'finalDate',
        disabledDate: date => date < event.initialDate,
        rules: [{ required: true, message: 'Favor de seleccionar la fecha final.' }],
        value: event.finalDate,
        onChange: (value: Dayjs) => setEvent(e => ({ ...e, finalDate: value })),
        md: 6
      },
      {
        typeControl: 'input',
        typeInput: 'number',
        label: 'Cantidad de boletos',
        name: 'total',
        disabled: type === "update",
        rules: event.id
          ? [{
            message: `La cantidad de boletos no puede ser menor a ${initTotalTickets}`,
            validator: (rule, value?: string) => !value || +value < initTotalTickets ? Promise.reject(rule.message) : Promise.resolve(),
          }]
          : [{ required: true, message: 'Favor de escribir la cantidad de boletos.' }],
        value: event.total,
        onChange: (value: string) => setEvent(e => ({ ...e, total: value ? +value : undefined })),
        md: 6
      },
      {
        typeControl: "file",
        name: "image",
        value: event.image,
        maxCount: 1,
        accept: "image/png, image/jpeg",
        onChange: (value: UploadFile<any>[]) => setEvent(e => ({ ...e, image: value })),
        md: 12,
        styleFI: { display: "flex", justifyContent: "center" },
        multiple: false,
        withOutCrop: true
      },
    ];

    if (user?.displayName === "SuperAdministrador") {
      inputs.push({
        typeControl: 'select',
        label: 'Empresa',
        name: 'companyName',
        value: event.companyName + "-" + event.companyUid,
        onChange: (value: string) => setEvent(e => ({ ...e, companyName: value.split("-")[0], companyUid: value.split("-")[1] })),
        md: 12,
        options: companies
      },
        {
          typeControl: 'textarea',
          typeInput: 'text',
          label: 'Texto cuando se Canjea QR',
          name: 'textExchange',
          value: event.textExchange,
          onChange: (value: string) => setEvent(e => ({ ...e, textExchange: value })),
          md: 12,
          multiple: false
        },
        {
          typeControl: 'input',
          typeInput: 'number',
          label: 'Cantidad de cupones x empleado',
          name: 'cuponsByEmploye',
          disabled: type === "update",
          value: event.cuponsByEmploye,
          onChange: (value: string) => setEvent(e => ({ ...e, cuponsByEmploye: value ? +value : undefined })),
          md: 12
        }
      )
    }
    return inputs
  }, [companies, event, initTotalTickets, type, user?.displayName])

  return (
    <div>
      <HeaderView
        title={titleForm[type]}
        path="/eventos"
        goBack
      />
      <Card>
        <DynamicForm
          initialValues={event}
          form={form}
          layout='vertical'
          loading={saving}
          onFinish={onFinish}
          justify="center"
          textSubmit={saving ? `Guardando boletos ${totalTicketsSaved} de ${event.total}` : undefined}
          inputs={inputs}
        />
      </Card>
    </div>
  )
}

export default CreateEvent;