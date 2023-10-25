import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DatePickerProps } from "antd/lib/date-picker";
import { CheckboxChangeEvent } from "antd/lib/checkbox";
import styled from "styled-components";
import { RootState } from "../features/store";
import {
  setTicketPacks,
  setCurrentPage,
  TicketPack,
} from "../features/ticketPackSlice";
import { firestore } from "../firebase/config";
import React from "react";
import {
  Button,
  Checkbox,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  TimePicker,
} from "antd";
import { Icon } from "@iconify/react";
import Navbar from "../components/navbar";
import SearchNotificationBar from "../components/search";
import moment from "moment";
import dayjs from "dayjs";

const StyledTicketpack = styled.div`
  background-color: #f9f6f4;
`;

type CSVDataRow = [
  number,
  string,
  string,
  string,
  string,
  string,
  string,
  string
];

type CSVContent = string;

type TablePaginationPosition =
  | "topLeft"
  | "topCenter"
  | "topRight"
  | "bottomLeft"
  | "bottomCenter"
  | "bottomRight";

const Ticketpack: React.FC = () => {
  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      key: "index",
    },
    {
      title: "Mã gói",
      dataIndex: "packageCode",
      key: "packageCode",
      className: "no-wrap",
    },
    {
      title: "Tên gói vé",
      dataIndex: "packageName",
      key: "packageName",
      className: "no-wrap",
    },
    {
      title: "Ngày áp dụng",
      key: "usageDateTime",
      className: "no-wrap",
      render: (
        text: any,
        record: { applicationDate: any; applicationTime: any }
      ) => {
        const applicationDate = record.applicationDate;
        const applicationTime = record.applicationTime;
        const usageDateTime = `${applicationDate} ${applicationTime}`;
        return <div className="table-cell-content">{usageDateTime}</div>;
      },
    },
    {
      title: "Ngày hết hạn",
      key: "expirationDateTime",
      render: (
        text: any,
        record: { expirationDate: any; expirationTime: any }
      ) => {
        const expirationDate = record.expirationDate;
        const expirationTime = record.expirationTime;
        const expirationDateTime = `${expirationDate} ${expirationTime} `;
        return <span>{expirationDateTime}</span>;
      },
    },
    {
      title: "Giá vé (VNĐ/Vé)",
      dataIndex: "ticketPrice",
      key: "ticketPrice",
      render: (text: string) => `${text}₫`,
    },
    {
      title: "Giá Combo (VNĐ/Combo)",
      key: "comboAndNumberOfTickets",
      render: (
        text: any,
        record: { comboPrice: string; numberOfTickets: string }
      ) => {
        const { comboPrice, numberOfTickets } = record;
        return `${comboPrice}₫/${numberOfTickets} vé`;
      },
    },
    {
      title: "Tình trạng",
      dataIndex: "status",
      key: "status",
      render: (text: string) => (
        <div className="no-wrap">
          <span
            className={`status-icon ${
              text === "Đang áp dụng"
                ? "not-used"
                : text === "Tắt"
                ? "expired"
                : ""
            }`}
          >
            <Icon icon="ion:ellipse" style={{ marginRight: "8px" }} />
            {text}
          </span>
        </div>
      ),
    },
    {
      title: "",
      dataIndex: "editButton",
      key: "editButton",
      render: (
        text: any,
        record: TicketPack // Thêm tham số record
      ) => (
        <Button
          className="capnhat"
          onClick={() => handleEditTicketPack(record)} // Truyền record vào hàm handleEditTicketPack
        >
          <Icon icon="lucide:edit" /> Cập nhật
        </Button>
      ),
    },
  ];

  const dispatch = useDispatch();

  const [selectedTicket, setSelectedTicket] = useState<TicketPack | null>(null);

  const ticketPacks = useSelector(
    (state: RootState) => state.ticketPack.ticketPacks
  );

  const currentPage = useSelector(
    (state: RootState) => state.ticketPack.currentPage
  );

  const [packageName, setPackageName] = useState("");

  const [applicationDate, setApplicationDate] = useState<Date | null>(null);

  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  const [selectedApplicationTime, setSelectedApplicationTime] =
    useState<Date | null>(null);

  const [selectedExpirationTime, setSelectedExpirationTime] =
    useState<Date | null>(null);

  const [ticketPrice, setTicketPrice] = useState("");

  const [comboPrice, setComboPrice] = useState("");

  const [numberOfTickets, setNumberOfTickets] = useState("");

  const [status, setStatus] = useState("");

  const [shouldUpdateTicket, setShouldUpdateTicket] = useState(false);

  const rowsPerPage = 4;

  const startIndex: number = (currentPage - 1) * rowsPerPage;

  const calculateIndex = (index: number): number => startIndex + index + 1;

  const [showOverlay, setShowOverlay] = useState(false);

  const [selectedTicketPack, setSelectedTicketPack] = useState(false);

  const generatePackageCode = () => {
    const randomNumber = Math.floor(Math.random() * 100);
    return `ALT${randomNumber}`;
  };

  const generateUniquePackageCode = async () => {
    let packageCode = generatePackageCode(); // Hàm tạo mã gói vé ngẫu nhiên
    const ticketPackRef = firestore.collection("ticketpack");

    while (true) {
      const snapshot = await ticketPackRef
        .where("packageCode", "==", packageCode)
        .get();
      if (snapshot.empty) {
        // Nếu không có tài liệu nào trong Firestore có cùng mã gói vé
        return packageCode; // Trả về mã gói vé duy nhất
      }

      // Nếu tìm thấy tài liệu có cùng mã gói vé, tiếp tục tạo mã mới và kiểm tra lại
      packageCode = generatePackageCode();
    }
  };

  const handleCheckboxChange = (e: CheckboxChangeEvent) => {
    console.log(e.target.checked);
  };

  const onChange: DatePickerProps["onChange"] = (date, dateString) => {
    console.log(date, dateString);
  };

  useEffect(() => {
    const fetchTicketPacks = async () => {
      try {
        const snapshot = await firestore.collection("ticketpack").get();
        const ticketPackData = snapshot.docs.map(
          (doc) => doc.data() as TicketPack
        );
        dispatch(setTicketPacks(ticketPackData));
      } catch (error) {
        console.error("Error fetching ticket packs:", error);
      }
    };

    fetchTicketPacks();

    if (shouldUpdateTicket) {
      setShouldUpdateTicket(false);
    }
  }, [dispatch, shouldUpdateTicket]);

  const handleSaveOverlay = async () => {
    let packageCode = generatePackageCode();
    let isDuplicate = false;

    while (true) {
      const docRef = firestore.collection("ticketpack").doc(packageCode);
      const doc = await docRef.get();
      if (!doc.exists) {
        break;
      } else {
        packageCode = generatePackageCode();
      }
    }

    const ticketPackData: TicketPack = {
      packageCode,
      packageName,
      applicationDate: applicationDate?.toLocaleDateString() ?? "",
      expirationDate: expirationDate?.toLocaleDateString() ?? "",
      ticketPrice,
      comboPrice,
      status,
      numberOfTickets,
      expirationTime: selectedExpirationTime?.toLocaleTimeString() ?? "",
      applicationTime: selectedApplicationTime?.toLocaleTimeString() ?? "",
    };

    try {
      await firestore
        .collection("ticketpack")
        .doc(packageCode)
        .set(ticketPackData);
      setShowOverlay(false);
      window.location.reload();
    } catch (error) {
      console.error("Error saving ticket pack:", error);
    }
  };

  const handleSelectChange = (
    value: string | null,
    option:
      | { value: string; label: string }
      | { value: string; label: string }[]
  ) => {
    const selectedLabel = Array.isArray(option)
      ? option[0]?.label
      : option?.label;
    console.log(selectedLabel);
  };

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };

  // Hàm xử lý sự kiện khi click vào nút "Lưu" để cập nhật gói vé đã chỉnh sửa

  const handleUpdateTicketPack = async () => {
    if (!selectedTicket) return; // Nếu không có vé được chọn, thoát

    const updatedTicket: TicketPack = {
      ...selectedTicket,
      packageName,
      applicationDate: applicationDate
        ? dayjs(applicationDate).format("DD/MM/YYYY")
        : "",
      expirationDate: expirationDate
        ? dayjs(expirationDate).format("DD/MM/YYYY")
        : "",
      ticketPrice,
      comboPrice,
      numberOfTickets,
      status,
      expirationTime: selectedExpirationTime?.toLocaleTimeString() ?? "",
      applicationTime: selectedApplicationTime?.toLocaleTimeString() ?? "",
    };

    try {
      // Kiểm tra xem tài liệu tồn tại trước khi thực hiện cập nhật
      const ticketRef = firestore
        .collection("ticketpack")
        .doc(selectedTicket.packageCode); // Sử dụng selectedTicket.packageCode làm document ID
      const ticketDoc = await ticketRef.get();

      if (ticketDoc.exists) {
        // Nếu tài liệu tồn tại, thực hiện cập nhật
        await ticketRef.update(updatedTicket);
        setSelectedTicket(null); // Xóa bỏ vé được chọn để ẩn overlay
        setSelectedTicketPack(false); // Đóng overlay cập nhật
      } else {
        console.error("Document not found:", selectedTicket.packageCode);
        // Xử lý tài liệu không tồn tại theo ý muốn, ví dụ: thông báo lỗi, tạo tài liệu mới, v.v.
      }
    } catch (error) {
      console.error("Error updating ticket pack:", error);
    }
    setShouldUpdateTicket(true);
    setSelectedTicketPack(false);
  };

  // Hàm xử lý sự kiện khi click vào nút "Cập nhật"
  const handleEditTicketPack = (ticket: TicketPack) => {
    setSelectedTicket(ticket);
    setPackageName(ticket.packageName);
    setApplicationDate(
      ticket.applicationDate
        ? moment(ticket.applicationDate, "DD/MM/YYYY").toDate()
        : null
    );
    setSelectedApplicationTime(
      ticket.applicationTime
        ? moment(ticket.applicationTime, "hh:mm a").toDate()
        : null
    );
    setExpirationDate(
      ticket.expirationDate
        ? moment(ticket.expirationDate, "DD/MM/YYYY").toDate()
        : null
    );
    setSelectedExpirationTime(
      ticket.expirationTime
        ? moment(ticket.expirationTime, "hh:mm a").toDate()
        : null
    );
    setTicketPrice(ticket.ticketPrice);
    setComboPrice(ticket.comboPrice);
    setNumberOfTickets(ticket.numberOfTickets);
    setStatus(ticket.status);
    setSelectedTicketPack(true);
  };

  const handleCancelEditOverlay = () => {
    setSelectedTicketPack(false);
  };

  const handleFilterButtonClick = () => {
    setShowOverlay(true);
  };

  const handleCancelOverlay = () => {
    setShowOverlay(false);
  };

  const [bottom] = useState<TablePaginationPosition>("bottomCenter");
  const formatDataForCSV = (data: TicketPack[]): CSVContent => {
    const headers: string[] = [
      "STT",
      "Mã gói",
      "Tên gói vé",
      "Ngày áp dụng",
      "Ngày hết hạn",
      "Giá vé (VNĐ/Vé)",
      "Giá combo (VNĐ/Combo)",
      "Tình trạng",
    ];

    const rows: CSVDataRow[] = data.map((ticketPack, index) => [
      index + 1,
      ticketPack.packageCode,
      ticketPack.packageName,
      ticketPack.applicationDate,
      ticketPack.expirationDate,
      ticketPack.ticketPrice,
      ticketPack.comboPrice,
      ticketPack.status,
    ]);

    const csvContent =
      headers.join(",") + "\n" + rows.map((row) => row.join(",")).join("\n");

    return csvContent;
  };

  const downloadCSV = (csvContent: CSVContent, fileName: string) => {
    // Convert the content to Blob with UTF-8 encoding
    const blob = new Blob(["\ufeff", csvContent], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    const formattedData: CSVContent = formatDataForCSV(ticketPacks);
    const fileName = "ticketPacks.csv";
    downloadCSV(formattedData, fileName);
  };

  const handleApplicationDateChange = (date: any, dateString: string) => {
    setApplicationDate(date);
  };

  const handleExpirationDateChange = (date: any, dateString: string) => {
    setExpirationDate(date);
  };

  const handleApplicationTimeChange = (time: any) => {
    setSelectedApplicationTime(time?.toDate() || null);
  };

  const handleExpirationTimeChange = (time: any) => {
    setSelectedExpirationTime(time?.toDate() || null);
  };

  const [searchText, setSearchText] = useState("");

  const filteredTicketPacks = ticketPacks.filter((ticketPack) =>
    ticketPack.packageCode.toLowerCase().includes(searchText.toLowerCase())
  );

  const onSearch = (value: string) => {
    setSearchText(value);
  };
  return (
    <StyledTicketpack>
      <div className="app">
        <Navbar />
        <div className="container-main">
          <SearchNotificationBar />
          <div className="content">
            <div className="content-main">
              <div className="title">
                <h2 className="noo-sh-title">Danh sách gói vé</h2>
              </div>
              <div className="search-filter">
                <div className="search-ticket">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm bằng mã gói"
                    value={searchText}
                    onChange={(e) => onSearch(e.target.value)}
                  />
                  <Icon
                    icon="material-symbols:search"
                    className="search-ticket-icon"
                  />
                </div>
                <div>
                  <button className="filter-filter-1" onClick={handleExportCSV}>
                    Xuất file (.CSV)
                  </button>

                  <button
                    onClick={handleFilterButtonClick}
                    className="filter-filter-2"
                  >
                    Thêm gói vé
                  </button>
                </div>
              </div>
              <div className="ticket-table">
                <Table
                  columns={columns}
                  dataSource={filteredTicketPacks.map((ticketPack, index) => ({
                    ...ticketPack,
                    index: calculateIndex(index),
                    key: ticketPack.packageCode,
                    editButton: null,
                  }))}
                  pagination={{
                    position: [bottom],
                    current: currentPage,
                    pageSize: rowsPerPage,
                    total: filteredTicketPacks.length,
                    onChange: handlePageChange,
                    className: "custom-pagination",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* cập nhật gói vé */}

      {selectedTicketPack && (
        <div className="overlay">
          <div className="overlay-content">
            <p>Cập nhật thông tin gói vé</p>
            <div className="overlay-filter">
              <div className="row pt-2">
                <div className="col">
                  <span>
                    Mã sự kiện <span className="red">*</span>
                  </span>
                </div>
                <div className="col">Tên sự kiện</div>
              </div>
              <div className="row pt-1">
                <div className="col">
                  <Input
                    value={packageName}
                    onChange={(e) => setPackageName(e.target.value)}
                  />
                </div>
                <div className="col">
                  <Input />
                </div>
              </div>
              <div className="row pt-3">
                <div className="col">
                  <span>Ngày áp dụng </span>
                </div>
                <div className="col">
                  <span>Ngày hết hạn</span>
                </div>
              </div>
              <div className="row pt-2">
                <div className="col">
                  <div className="row">
                    <div className="col">
                      <Space direction="vertical">
                        <DatePicker
                          onChange={handleApplicationDateChange}
                          format="DD/MM/YYYY"
                          value={
                            applicationDate ? dayjs(applicationDate) : null
                          }
                        />
                      </Space>
                    </div>
                    <div className="col">
                      <Space wrap>
                        <TimePicker
                          use12Hours
                          onChange={handleApplicationTimeChange}
                          value={
                            selectedApplicationTime
                              ? dayjs(selectedApplicationTime)
                              : null
                          }
                        />
                      </Space>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="row">
                    <div className="col">
                      {" "}
                      <Space direction="vertical">
                        <DatePicker
                          onChange={handleExpirationDateChange}
                          format="DD/MM/YYYY"
                          value={expirationDate ? dayjs(expirationDate) : null}
                        />
                      </Space>
                    </div>
                    <div className="col">
                      <Space wrap>
                        <TimePicker
                          use12Hours
                          onChange={handleExpirationTimeChange}
                          value={
                            selectedExpirationTime
                              ? dayjs(selectedExpirationTime)
                              : null
                          }
                        />
                      </Space>
                    </div>
                  </div>
                </div>
                <col />
              </div>
              <div className="row pt-3">
                <span>Giá vé áp dụng</span>
              </div>
              <div className="row pt-2">
                <div className="checkbox-input-row">
                  <Checkbox onChange={handleCheckboxChange}>
                    Vé lẻ (vnđ/vé) với giá
                  </Checkbox>
                  <Input
                    style={{ width: "20%" }}
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                  />
                  /vé
                </div>
              </div>
              <div className="row pt-2">
                <div className="checkbox-input-row">
                  <Checkbox onChange={handleCheckboxChange}>
                    Combo vé với giá
                  </Checkbox>
                  <Input
                    style={{ width: "20%" }}
                    value={comboPrice}
                    onChange={(e) => setComboPrice(e.target.value)}
                  />
                  /
                  <Input
                    style={{ width: "20%" }}
                    value={numberOfTickets}
                    onChange={(e) => setNumberOfTickets(e.target.value)}
                  />
                  /vé
                </div>
              </div>
              <div className="row pt-3">
                <span>Tình trạng</span>
              </div>
              <div className="row pt-2">
                <div className="">
                  <Select
                    className="select-ticket"
                    showSearch
                    placeholder="Select a person"
                    optionFilterProp="children"
                    value={status}
                    onChange={(value) => setStatus(value)}
                    onSearch={onSearch}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={[
                      {
                        value: "Đang áp dụng",
                        label: "Đang áp dụng",
                      },
                      {
                        value: "Tắt",
                        label: "Tắt",
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="row pt-2">
                <span>
                  <span className="red">*</span> là thông tin bắt buộc
                </span>
              </div>
            </div>
            <div className="pt-4">
              <div className="huyluu">
                <button
                  className="filter-filter-3"
                  onClick={handleCancelEditOverlay}
                >
                  Hủy
                </button>

                <button
                  className="filter-filter-4"
                  onClick={handleUpdateTicketPack}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* thêm gói vé */}
      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <p>Thêm gói vé</p>
            <div className="overlay-filter">
              <div className="row pt-2">
                <div className="col">
                  <span>
                    Tên gói vé <span className="red">*</span>
                  </span>
                </div>
              </div>
              <div className="row pt-1">
                <div className="col">
                  <Input
                    placeholder="Nhập tên gói vé"
                    style={{ width: "40%" }}
                    required
                    type="text"
                    onChange={(e) => setPackageName(e.target.value)}
                  />
                </div>
              </div>
              <div className="row pt-3">
                <div className="col">
                  <span>Ngày áp dụng </span>
                </div>
                <div className="col">
                  <span>Ngày hết hạn</span>
                </div>
              </div>
              <div className="row pt-2">
                <div className="col">
                  <div className="row">
                    <div className="col">
                      {" "}
                      <Space direction="vertical">
                        <DatePicker
                          placeholder="Chọn ngày"
                          onChange={(date) =>
                            setApplicationDate(date?.toDate() || null)
                          }
                          format="DD/MM/YYYY"
                        />
                      </Space>
                    </div>
                    <div className="col">
                      <Space wrap>
                        <TimePicker
                          placeholder="Chọn thời gian"
                          use12Hours
                          onChange={handleApplicationTimeChange}
                        />
                      </Space>
                    </div>
                  </div>
                </div>
                <div className="col">
                  <div className="row">
                    <div className="col">
                      <Space direction="vertical">
                        <DatePicker
                          placeholder="Chọn ngày"
                          onChange={(date) =>
                            setExpirationDate(date?.toDate() || null)
                          }
                          format="DD/MM/YYYY"
                        />
                      </Space>
                    </div>
                    <div className="col">
                      <Space wrap>
                        <TimePicker
                          placeholder="Chọn thời gian"
                          use12Hours
                          onChange={handleExpirationTimeChange}
                        />
                      </Space>
                    </div>
                  </div>
                </div>
                <col />
              </div>
              <div className="row pt-3">
                <span>Giá vé áp dụng</span>
              </div>
              <div className="row pt-2">
                <div className="checkbox-input-row">
                  <Checkbox onChange={handleCheckboxChange}>
                    Vé lẻ (vnđ/vé) với giá
                  </Checkbox>
                  <Input
                    style={{ width: "20%" }}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    type="text"
                    className="input-price"
                    placeholder="Giá vé"
                  />
                  /vé
                </div>
              </div>
              <div className="row pt-2">
                <div className="checkbox-input-row">
                  <Checkbox onChange={handleCheckboxChange}>
                    Combo vé với giá
                  </Checkbox>
                  <Input
                    style={{ width: "20%" }}
                    onChange={(e) => setComboPrice(e.target.value)}
                    type="text"
                    className="input-price"
                    placeholder="Giá vé"
                  />
                  /
                  <Input
                    style={{ width: "20%" }}
                    onChange={(e) => setNumberOfTickets(e.target.value)}
                    type="text"
                    placeholder="Số vé"
                  />
                  /vé
                </div>
              </div>
              <div className="row pt-3">
                <span>Tình trạng</span>
              </div>
              <div className="row pt-2">
                <div className="">
                  <Select
                    className="select-ticket"
                    showSearch
                    placeholder="Chọn tình trạng vé"
                    optionFilterProp="children"
                    onChange={(label) => setStatus(label)}
                    onSearch={onSearch}
                    filterOption={(input, option) =>
                      (option?.label ?? "")
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                    options={[
                      {
                        value: "Đang áp dụng",
                        label: "Đang áp dụng",
                      },
                      {
                        value: "Tắt",
                        label: "Tắt",
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="row pt-2">
                <span>
                  <span className="red">*</span> là thông tin bắt buộc
                </span>
              </div>
            </div>
            <div className="pt-4">
              <div className="huyluu">
                <button
                  className="filter-filter-3"
                  onClick={handleCancelOverlay}
                >
                  Hủy
                </button>

                <button className="filter-filter-4" onClick={handleSaveOverlay}>
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </StyledTicketpack>
  );
};

export default Ticketpack;
