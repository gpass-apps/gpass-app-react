import { FC, useState } from 'react';
import { Col, Input, Row, Select, DatePicker } from 'antd';
import { OptiosSearchValues } from "../table";
import { Dayjs } from "dayjs";

interface Props {
  onSearch: (search: string | Dayjs[], keySearch: string) => void;
  placeholder?: string;
  searchValues: Record<string, string>;
  optiosSearchValues?: OptiosSearchValues[];
  onScanFilterChange?: (value: string) => void;
}

const { Search } = Input;

const SearchTable: FC<Props> = ({ onSearch, placeholder, searchValues, optiosSearchValues, onScanFilterChange }) => {
  const [keySearch, setKeySearch] = useState<string>(Object.keys(searchValues)[0]);
  const [scanFilter, setScanFilter] = useState("");
  
  const handleKeySearchChange = (value: string) => {
    setKeySearch(value);

    setScanFilter("");
    onScanFilterChange?.("");
  };

  return (
    <Row gutter={10}>
      <Col xs={24} md={4}>
        <Select
          style={{ width: '100%' }}
          value={keySearch}
          onChange={handleKeySearchChange}
        >
          {Object.keys(searchValues).map((key) => (
            <Select.Option key={key} value={key}>
              {searchValues[key]}
            </Select.Option>
          ))}
        </Select>
      </Col>

      {keySearch.includes("branch") && (
        <Col xs={24} md={2}>
          <Select
            style={{ width: '100%', marginBottom: '7%' }}
            placeholder="Estado de escaneo"
            value={scanFilter}
            onChange={value => {
              setScanFilter(value);
              onScanFilterChange?.(value);
            }}
          >
            <Select.Option value="">Todos</Select.Option>
            <Select.Option value="Si">Escaneados</Select.Option>
            <Select.Option value="No">No escaneados</Select.Option>
          </Select>
        </Col>
      )}

      <Col md={keySearch.includes("branch") ? 18 : 20}>
        {
          Object.keys(searchValues)?.some(key => key.includes("date") && keySearch.includes("date"))
            ?
            <DatePicker.RangePicker onChange={value => onSearch(value as any, "dateScanned")} />
            :
            optiosSearchValues?.some(option => option.propSearch === keySearch)
              ? <Select style={{ width: '100%' }} onChange={(value) => onSearch(value, keySearch)}>
                {
                  optiosSearchValues.find(optionSearch => optionSearch.propSearch === keySearch)?.options.map(option => (
                    <Select.Option key={option.key} value={option.key}>
                      {option.label}
                    </Select.Option>
                  ))
                }
              </Select>
              : <Search
                enterButton
                onSearch={(value) => onSearch(value, keySearch)}
                placeholder={placeholder}
                style={{ width: '100%' }}
              />
        }

      </Col>
    </Row>
  )
}

export default SearchTable;