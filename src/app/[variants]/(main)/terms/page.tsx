import { Typography } from '@lobehub/ui';
import { Divider } from 'antd';
import { Flexbox } from 'react-layout-kit';

import { OFFICIAL_SITE } from '@/const/url';
import { metadataModule } from '@/server/metadata';
import { DynamicLayoutProps } from '@/types/next';
import { RouteVariants } from '@/utils/server/routeVariants';

export const generateMetadata = async (props: DynamicLayoutProps) => {
    return metadataModule.generate({
        canonical: `${OFFICIAL_SITE}/terms`,
        description: `Điều khoản sử dụng của Phở Chat (pho.chat) - Vui lòng đọc kỹ trước khi sử dụng.`,
        title: 'Điều khoản sử dụng',
        url: '/terms',
    });
};

const Page = async (props: DynamicLayoutProps) => {
    const { isMobile } = await RouteVariants.getVariantsFromProps(props);

    return (
        <Flexbox align="center" paddingBlock={isMobile ? 16 : 48} width={'100%'}>
            <Flexbox paddingInline={isMobile ? 16 : 0} style={{ maxWidth: 960 }} width={'100%'}>
                <Typography>
                    <h1>Điều khoản sử dụng</h1>
                    <p><strong>Ngày có hiệu lực:</strong> 04/01/2025</p>
                    <p>
                        Cảm ơn bạn đã sử dụng Phở Chat! Những Điều khoản sử dụng này ("Điều khoản") áp dụng cho việc bạn sử dụng
                        Phở Chat, bao gồm ứng dụng web, phần mềm, công cụ, dữ liệu, tài liệu và trang web (gọi chung là "Dịch vụ").
                        Các Điều khoản này tạo thành một thỏa thuận pháp lý giữa bạn và Phở Chat (pho.chat) ("chúng tôi", "của chúng tôi").
                    </p>

                    <p>
                        <strong>BẰNG VIỆC SỬ DỤNG DỊCH VỤ, BẠN ĐỒNG Ý VỚI CÁC ĐIỀU KHOẢN NÀY. NẾU BẠN KHÔNG ĐỒNG Ý, VUI LÒNG KHÔNG SỬ DỤNG DỊCH VỤ.</strong>
                    </p>

                    <Divider />

                    <h2>1. Đăng ký và Truy cập</h2>
                    <ul>
                        <li><strong>Độ tuổi:</strong> Bạn phải từ 13 tuổi trở lên để sử dụng Dịch vụ. Nếu bạn dưới 18 tuổi, bạn phải có sự cho phép của cha mẹ hoặc người giám hộ hợp pháp.</li>
                        <li><strong>Tài khoản:</strong> Bạn phải cung cấp thông tin chính xác và đầy đủ khi đăng ký tài khoản. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình và mọi hoạt động diễn ra dưới tài khoản đó.</li>
                        <li><strong>Hành vi nghiêm cấm:</strong> Bạn không được chia sẻ thông tin đăng nhập hoặc chuyển nhượng tài khoản cho người khác mà không có sự đồng ý của chúng tôi.</li>
                    </ul>

                    <h2>2. Sử dụng Dịch vụ</h2>
                    <p><strong>Những gì bạn có thể làm:</strong> Bạn có thể truy cập và sử dụng Dịch vụ tuân theo các Điều khoản này và pháp luật hiện hành.</p>
                    <p><strong>Những gì bạn KHÔNG được làm:</strong> Bạn không được:</p>
                    <ul>
                        <li>Sử dụng Dịch vụ cho bất kỳ hoạt động bất hợp pháp, lừa đảo hoặc gây hại nào.</li>
                        <li>Vi phạm quyền của người khác (bao gồm quyền riêng tư và sở hữu trí tuệ).</li>
                        <li>Đảo ngược kỹ thuật (reverse engineer), biên dịch ngược, hoặc cố gắng khám phá mã nguồn của Dịch vụ.</li>
                        <li>Sử dụng phương pháp tự động (bot, scraper) để truy cập Dịch vụ trừ khi được cho phép qua API chính thức.</li>
                        <li>Sử dụng đầu ra của Dịch vụ để phát triển các mô hình nền tảng cạnh tranh trực tiếp với Phở Chat.</li>
                    </ul>

                    <h2>3. Nội dung Của Bạn</h2>
                    <ul>
                        <li><strong>Đầu vào và Đầu ra:</strong> Bạn có thể cung cấp đầu vào ("Input") và nhận đầu ra ("Output") từ Dịch vụ. Giữa các bên và trong phạm vi pháp luật cho phép, bạn sở hữu tất cả Input. Phở Chat chuyển nhượng cho bạn mọi quyền, quyền sở hữu và lợi ích đối với Output.</li>
                        <li><strong>Trách nhiệm về Nội dung:</strong> Bạn chịu trách nhiệm hoàn toàn về Input và Output, bao gồm cả việc đảm bảo chúng không vi phạm pháp luật hoặc Điều khoản này.</li>
                        <li><strong>Tính tương tự của Nội dung:</strong> Do bản chất của AI, Output có thể không phải là duy nhất. Những người dùng khác có thể nhận được Output tương tự. Bạn không có quyền sở hữu đối với các Output của người dùng khác.</li>
                    </ul>

                    <h2>4. KHƯỚC TỪ TRÁCH NHIỆM VỀ ĐỘ CHÍNH XÁC (QUAN TRỌNG)</h2>
                    <p>
                        <strong>Dịch vụ sử dụng công nghệ trí tuệ nhân tạo (AI) và máy học, vốn hoạt động dựa trên xác suất và có thể tạo ra thông tin không chính xác. Khi sử dụng Dịch vụ, bạn thừa nhận và đồng ý rằng:</strong>
                    </p>
                    <ul>
                        <li><strong>Không phải là sự thật tuyệt đối:</strong> Output có thể không chính xác, gây hiểu lầm hoặc sai lệch hoàn toàn. Đừng dựa vào Output như là nguồn sự thật duy nhất.</li>
                        <li><strong>Cần kiểm chứng:</strong> Bạn NÊN và CẦN PHẢI tự mình đánh giá mức độ chính xác của bất kỳ Output nào phù hợp với trường hợp sử dụng của bạn, bao gồm cả việc rà soát bởi con người.</li>
                        <li><strong>Không phải lời khuyên chuyên môn:</strong> Output không nhằm mục đích thay thế cho lời khuyên chuyên môn (như pháp lý, y tế, tài chính, v.v.).</li>
                        <li><strong>Miễn trừ trách nhiệm:</strong> Phở Chat và đội ngũ phát triển KHÔNG chịu trách nhiệm cho bất kỳ sai sót nào trong Output hoặc bất kỳ thiệt hại nào phát sinh từ việc bạn tin tưởng vào Output đó.</li>
                    </ul>

                    <h2>5. Quyền Sở Hữu Trí Tuệ</h2>
                    <p>
                        Phở Chat (và các bên cấp phép của chúng tôi) sở hữu mọi quyền, quyền sở hữu và lợi ích đối với Dịch vụ, bao gồm tên thương hiệu, logo, mã nguồn, công nghệ nền tảng và các cải tiến trong tương lai.
                    </p>

                    <h2>6. Phí và Thanh Toán (Nếu áp dụng)</h2>
                    <p>
                        Nếu bạn mua bất kỳ Dịch vụ trả phí nào, bạn đồng ý cung cấp thông tin thanh toán đầy đủ và chính xác. Các khoản thanh toán có thể không được hoàn lại trừ khi được quy định rõ trong chính sách hoàn tiền của chúng tôi hoặc theo yêu cầu của pháp luật. Chúng tôi có quyền thay đổi giá cả và sẽ thông báo trước cho bạn.
                    </p>

                    <h2>7. Chấm dứt</h2>
                    <p>
                        Chúng tôi có thể đình chỉ hoặc khóa tài khoản của bạn ngay lập tức nếu bạn vi phạm các Điều khoản này. Bạn có thể chấm dứt việc sử dụng Dịch vụ bất cứ lúc nào. Khi chấm dứt, quyền sử dụng Dịch vụ của bạn sẽ hết hiệu lực ngay lập tức.
                    </p>

                    <h2>8. Tuyên Bố Từ Chối Bảo Đảm</h2>
                    <p>
                        DỊCH VỤ ĐƯỢC CUNG CẤP TRÊN CƠ SỞ "NGUYÊN TRẠNG" (AS IS) VÀ "NHƯ SẴN CÓ" (AS AVAILABLE). TRONG PHẠM VI TỐI ĐA ĐƯỢC PHÁP LUẬT CHO PHÉP, PHỞ CHAT TỪ CHỐI MỌI BẢO ĐẢM, DÙ RÕ RÀNG HAY NGỤ Ý, BAO GỒM CÁC BẢO ĐẢM VỀ TÍNH THƯƠNG MẠI, SỰ PHÙ HỢP CHO MỘT MỤC ĐÍCH CỤ THỂ VÀ KHÔNG XÂM PHẠM. CHÚNG TÔI KHÔNG ĐẢM BẢO RẰNG DỊCH VỤ SẼ KHÔNG BỊ GIÁN ĐOẠN, KHÔNG CÓ LỖI HOẶC AN TOÀN TUYỆT ĐỐI.
                    </p>

                    <h2>9. Giới Hạn Trách Nhiệm (Limitation of Liability)</h2>
                    <p>
                        TRONG PHẠM VI TỐI ĐA ĐƯỢC PHÁP LUẬT CHO PHÉP, PHỞ CHAT, CÁC CÔNG TY LIÊN KẾT, GIÁM ĐỐC, NHÂN VIÊN VÀ ĐỐI TÁC CUNG CẤP CỦA CHÚNG TÔI SẼ <strong>KHÔNG CHỊU TRÁCH NHIỆM</strong> ĐỐI VỚI BẤT KỲ THIỆT HẠI NÀO (DÙ LÀ TRỰC TIẾP, GIÁN TIẾP, NGẪU NHIÊN, ĐẶC BIỆT, HỆ QUẢ HAY TRỪNG PHẠT), BAO GỒM NHƯNG KHÔNG GIỚI HẠN Ở: MẤT LỢI NHUẬN, MẤT DỮ LIỆU, MẤT UY TÍN, HOẶC CÁC TỔN THẤT VÔ HÌNH KHÁC, PHÁT SINH TỪ:
                    </p>
                    <ul>
                        <li>VIỆC BẠN SỬ DỤNG HOẶC KHÔNG THỂ SỬ DỤNG DỊCH VỤ;</li>
                        <li>BẤT KỲ HÀNH VI HOẶC NỘI DUNG NÀO CỦA BÊN THỨ BA TRÊN DỊCH VỤ;</li>
                        <li>BẤT KỲ NỘI DUNG NÀO CÓ ĐƯỢC TỪ DỊCH VỤ; VÀ</li>
                        <li>VIỆC TRUY CẬP, SỬ DỤNG HOẶC BIẾN ĐỔI TRÁI PHÉP CÁC TRUYỀN TẢI HOẶC NỘI DUNG CỦA BẠN.</li>
                    </ul>
                    <p>
                        TRONG MỌI TRƯỜNG HỢP, TỔNG TRÁCH NHIỆM PHÁP LÝ CỦA PHỞ CHAT ĐỐI VỚI BẠN CHO TẤT CẢ CÁC KHIẾU NẠI SẼ KHÔNG VƯỢT QUÁ SỐ TIỀN BẠN ĐÃ TRẢ CHO CHÚNG TÔI TRONG 12 THÁNG QUA ĐỂ SỬ DỤNG DỊCH VỤ (NẾU CÓ) HOẶC 2.000.000 VNĐ, TÙY THEO SỐ NÀO LỚN HƠN.
                    </p>

                    <h2>10. Thay Đổi Điều Khoản</h2>
                    <p>
                        Chúng tôi có thể sửa đổi các Điều khoản này theo thời gian. Chúng tôi sẽ thông báo cho bạn về các thay đổi quan trọng (ví dụ: qua email hoặc thông báo trong ứng dụng). Bằng cách tiếp tục sử dụng Dịch vụ sau khi các thay đổi có hiệu lực, bạn đồng ý bị ràng buộc bởi các Điều khoản mới.
                    </p>

                    <h2>11. Thông Tin Liên Hệ</h2>
                    <p>
                        Nếu bạn có bất kỳ câu hỏi nào về các Điều khoản này, vui lòng liên hệ với chúng tôi tại:
                        <a href="mailto:hi@pho.chat"> hi@pho.chat</a>.
                    </p>
                </Typography>
            </Flexbox>
        </Flexbox>
    );
};

export default Page;
