import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Col, Empty, Row, Select, Table as TableAnt, message } from 'antd';
import { ColumnsType } from 'antd/es/table';
import SearchTable from '../searchTable';
import TableActionsButtons from "./tableActionsButtons";
import { PropsUseCollection } from "../../hooks/useCollection";
import useCollection from "../../hooks/useCollection";
import { getDocById, update, deleteDocument } from "../../services/firebase";
import { DocumentData, DocumentSnapshot, QueryConstraint, endAt, orderBy, startAfter, startAt, where } from "firebase/firestore";
import { Document, Page, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import { Button } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { Ticket, Coupon } from "../../interfaces";
import { post } from './../../services/index';
import useAbortController from "./../../hooks/useAbortController";
import { useLocation } from 'react-router-dom';
import dayjs, { Dayjs } from "dayjs";
import { ExpandableConfig } from "antd/lib/table/interface";
import { useAuth } from "./../../context/authContext";

export interface Option {
	key: string;
	label: string;
}

export interface OptiosSearchValues {
	propSearch: string;
	options: Option[];
}

interface ExtraFilter {
	key: string;
	label: string;
	options?: Option[];
	type: "select";
}

export interface PropsTable<T> extends PropsUseCollection {
	header?: ReactNode;
	columns: ColumnsType<T>;
	wait?: boolean;
	placeholderSearch?: string;
	pathEdit?: string;
	formatDate?: string;
	searchValues: Record<string, string>;
	removeTableActions?: boolean;
	downloadPdf?: boolean;
	downloadPdfCoupons?: boolean;
	imageEventUrl?: string;
	onLoadData?: (data: T[]) => void;
	optiosSearchValues?: OptiosSearchValues[];
	expandable?: ExpandableConfig<any>;
	scrollY?: string;
	localSearch?: boolean;
	triggerReload?: boolean;
	localSorts?: {
		key: keyof T;
		order: "asc" | "desc";
	}[];
	onChangeQuery?: (query: QueryConstraint[]) => void;
	extraFilters?: ExtraFilter[];
}

interface TableData {
	search: string | Dayjs[];
	searchKey: string;
	lastDoc?: DocumentSnapshot<DocumentData, DocumentData>;
	collection: string;
	extraFilters?: {
		key: string;
		value: string;
	}[];
}

const { PRESENTED_IMAGE_SIMPLE } = Empty;

const stylesPDF = StyleSheet.create({
	page: {
		flexDirection: 'column',
		backgroundColor: '#FFFFFF',
		position: 'relative',
	},
	backgroundImage: {
		position: 'absolute',
		width: '100%',
		height: '100%',
	},
	qrImage: {
		position: 'absolute',
		top: '45%',
		left: '48%',
		transform: 'translate(-50%, -50%)',
		width: 120, // Ajusta el tamaño del código QR según tus necesidades
		height: 120,
	},
});

const Table = <T extends {}>({
	columns: columnsProp,
	wait, placeholderSearch,
	pathEdit,
	collection,
	query: queryProp,
	formatDate,
	mergeResponse = true,
	searchValues,
	removeTableActions,
	downloadPdf,
	downloadPdfCoupons,
	imageEventUrl,
	onLoadData,
	optiosSearchValues,
	expandable,
	scrollY,
	localSearch,
	triggerReload,
	localSorts,
	onChangeQuery,
	extraFilters,
}: PropsTable<T>) => {
	const { user } = useAuth();
	const location = useLocation();
	const path = location;
	const abortController = useAbortController();
	const [tableData, setTableData] = useState<TableData>({ search: "", searchKey: "", collection });
	const [search, setSearch] = useState<string | Dayjs[]>("");
	const [searchKey, setSearchKey] = useState("");

	useEffect(() => {
		if (!triggerReload) return;

		setTableData(prev => ({ ...prev, lastDoc: undefined, collection: "" }));
		setTimeout(() => {
			setTableData(prev => ({ ...prev, collection }));
		}, 200);
	}, [collection, triggerReload]);

	const query = useMemo<QueryConstraint[]>(() => {
		const { search, searchKey, lastDoc } = tableData;
		let _query = [...queryProp];

		if (search && typeof search === "string") {
			_query = _query.filter(q => q.type !== "orderBy");

			if (searchKey === "number") {
				_query.push(...[orderBy(searchKey), where(searchKey, "==", +search)]);
			} else {
				_query.push(...[orderBy(searchKey), startAt(search), endAt(search + '\uf8ff')]);
			}
		}

		tableData.extraFilters?.forEach(({ key, value }) => {
			_query.push(where(key, "==", value));
		});

		if (search && Array.isArray(search)) {
			const indexOrderBy = _query.findIndex(q => q.type === "orderBy");

			if (indexOrderBy >= 0) {
				_query.splice(indexOrderBy, 1);
			}

			const _search = search as Dayjs[];

			const startDate = _search[0].toDate();
			const endDate = _search[1].toDate();
			startDate.setHours(0, 0, 0, 0);
			endDate.setHours(23, 59, 59, 59);

			_query.push(...[orderBy(searchKey, "desc"), where(searchKey, ">=", startDate), where(searchKey, "<=", endDate)]);
		}

		if (lastDoc) {
			_query.push(startAfter(lastDoc));
		}

		return _query;
	}, [tableData, queryProp]);

	useEffect(() => {
		onChangeQuery && onChangeQuery(query);
	}, [query, onChangeQuery]);

	const { loading, data, setData } = useCollection<T & { id: string; }>({ wait, query, collection: tableData.collection, formatDate, mergeResponse });

	const deleteUser = useCallback((r: T & { id: string; }) => post(`/users/del`, r, abortController.current!), [abortController]);

	useEffect(() => {
		if (loading || !data.length) return;

		const tableBody = document.querySelector('.ant-table-body');
		if (!tableBody) return;

		const handleScroll = async () => {
			const isBottom = tableBody.scrollTop + tableBody.clientHeight >= tableBody.scrollHeight;

			if (!isBottom) return;

			const lastItem = data[data.length - 1];

			if (!lastItem?.id) return;

			const doc = await getDocById(collection, lastItem.id);

			setTableData(prev => ({ ...prev, lastDoc: doc }));
		};

		tableBody.addEventListener('scroll', handleScroll);

		return () => {
			tableBody.removeEventListener('scroll', handleScroll);
		};
	}, [collection, loading, data]);

	useEffect(() => {
		onLoadData && onLoadData(data);
	}, [data, onLoadData]);

	const columns = useMemo<ColumnsType<T>>(() => {
		if (downloadPdf || downloadPdfCoupons) {
			columnsProp.push({
				title: "Descargar QR",
				dataIndex: "downlaodQr",
				key: "downlaodQr",
				render: (_, record) => {
					const t = record as any as Ticket & Coupon;
					const isTicket = downloadPdf;

					return (
						<Button
							icon={
								<DownloadOutlined
									style={{
										color: t.isDownloaded ? '#ffffff' : ""
									}}
								/>
							}
							style={{
								backgroundColor: t.isDownloaded ? '#34d960' : ""
							}}
							onClick={async () => {
								const canvasQr = document.getElementById(
									t.number.toString()
								) as HTMLCanvasElement | null;

								if (!canvasQr) {
									message.error(
										`Error al descargar el ${isTicket ? "ticket" : "cupon"}, intentelo de nuevo`,
										4
									);
									return;
								}

								const newWidth = 400;
								const newHeight = 400;

								const resizedCanvas = document.createElement("canvas");

								resizedCanvas.width = newWidth;
								resizedCanvas.height = newHeight;

								const ctx = resizedCanvas.getContext("2d");

								ctx?.drawImage(
									canvasQr,
									0,
									0,
									newWidth,
									newHeight
								);

								const qrUrl = resizedCanvas.toDataURL(
									"image/octet-stream"
								);

								const blob = await pdf(
									<Document>
										<Page
											size={{ width: 440, height: 800 }}
											style={stylesPDF.page}
										>
											<Image
												src={imageEventUrl}
												style={stylesPDF.backgroundImage}
											/>

											<Image
												src={qrUrl}
												style={stylesPDF.qrImage}
											/>
										</Page>
									</Document>
								).toBlob();

								const formattedDate = dayjs().format(
									'DD-MM-YYYY-HH-mm-ss'
								);

								const url = window.URL.createObjectURL(blob);

								const a = document.createElement('a');
								a.href = url;

								a.download = `${isTicket
									? t?.userAmbassadorName || ""
									: t?.userEmployeeId || ""
									}_${isTicket ? "Ticket" : "Cupon"
									}-${t.number}_${formattedDate}.pdf`;

								a.click();
								a.remove();

								setData(prev =>
									prev.map(item =>
										item.id === t.id
											? {
												...item,
												isDownloaded: true
											} as any
											: item
									) as (T & { id: string; })[]
								);

								if (!t.isDownloaded) {
									await update(
										isTicket ? "Tickets" : "Coupons",
										t.id as string,
										{
											...t,
											isDownloaded: true
										}
									);
								}
							}}
						/>
					);
				}
			});
		}

		if (removeTableActions || ["Administrador", "Embajador", "Lector"].includes(user?.displayName!)) return columnsProp.map(c => ({ ...c, width: c.width || 150 }));

		return [
			...columnsProp.map(c => ({ ...c, width: c.width || 150 })),
			{
				title: 'Acciones',
				key: 'actions',
				fixed: 'right',
				width: 100,
				render: (_, record: T) => {
					const r = record as T & { id: string; };
					return (
						<TableActionsButtons
							record={record}
							onDeleted={() => {
								setTableData(prev => ({ ...prev, collection: "" }));
								setTimeout(() => {
									setTableData({ collection, lastDoc: undefined, search, searchKey, });
								}, 200);
							}}
							fun={() => {
								if (path.pathname === "/usuarios") return deleteUser(r);

								if (["Coupons"].includes(collection)) {
									return deleteDocument(collection, r.id);
								}

								return update(collection, r.id, { disabled: true });
							}}
							pathEdit={pathEdit}
						/>
					);
				},
			}
		];
	}, [columnsProp, pathEdit, collection, removeTableActions, downloadPdf, downloadPdfCoupons, imageEventUrl, setData, path, deleteUser, user?.displayName]);

	const dataSource = useMemo(() => {
		let result = searchKey && search
			? data.filter(f => {
				const val = f[searchKey as keyof (T & { id: string; })];
				return val != null ? String(val).toLowerCase().includes(search.toString().toLowerCase()) : false;
			})
			: [...data];

		if (!localSorts?.length) return result;

		result.sort((a, b) => {
			for (const { key, order } of localSorts) {
				const aVal = a[key as keyof (T & { id: string; })];
				const bVal = b[key as keyof (T & { id: string; })];

				if (aVal === bVal) continue;
				if (aVal === undefined || aVal === null) return 1;
				if (bVal === undefined || bVal === null) return -1;

				let diff = 0;
				if (typeof aVal === "number" && typeof bVal === "number") {
					diff = aVal - bVal;
				} else if (typeof aVal === "string" && typeof bVal === "string") {
					diff = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
				} else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
					diff = (aVal ? 1 : 0) - (bVal ? 1 : 0);
				} else {
					diff = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" });
				}

				if (diff !== 0) {
					return order === "desc" ? -diff : diff;
				}
			}
			return 0;
		});

		return result;
	}, [data, search, searchKey, localSorts]);

	console.log(tableData);

	return (
		<div>
			<SearchTable
				onSearch={(_search, _searchKey) => {
					if (localSearch) {
						setSearch(_search);
						setSearchKey(_searchKey);
						return;
					}

					setTableData(prev => ({ ...prev, collection: "" }));
					setTimeout(() => {
						setTableData(prev => ({ ...prev, search: _search, searchKey: _searchKey, collection, lastDoc: undefined }));
					}, 200);
				}}
				placeholder={placeholderSearch}
				searchValues={searchValues}
				optiosSearchValues={optiosSearchValues}
			/>
			<br />
			<Row gutter={10}>
				{
					extraFilters?.map(filter => (
						<Col key={filter.key} xs={24} md={4}>
							<Select
								style={{ width: '100%' }} placeholder={`Seleccione el ${filter.label.toLowerCase()}`}
								onChange={(value) => {
									setTableData(prev => ({ ...prev, collection: "" }));

									setTimeout(() => {
										setTableData(prev => {
											const others = prev.extraFilters?.filter(f => f.key !== filter.key) || [];
											return {
												...prev,
												collection,
												extraFilters: value ? [...others, { key: filter.key, value }] : others
											};
										});
									}, 200);
								}}
							>
								{
									filter.options?.map(option => (
										<Select.Option key={option.key} value={option.key}>
											{option.label}
										</Select.Option>
									))
								}
							</Select>
						</Col>
					))
				}
			</Row>

			<br />
			<TableAnt
				sticky
				scroll={{ x: 400, y: scrollY || "75vh", scrollToFirstRowOnChange: false }}
				columns={columns}
				dataSource={dataSource}
				loading={loading}
				locale={{ emptyText: <Empty image={PRESENTED_IMAGE_SIMPLE} description='Sin registros.' /> }}
				rowKey="id"
				pagination={false}
				expandable={expandable}
			/>
		</div>
	);
};

export default Table;